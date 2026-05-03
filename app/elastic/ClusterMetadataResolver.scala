package elastic

import javax.inject.{Inject, Singleton}

import models.ElasticServer
import play.api.libs.json.{JsValue, Json}
import play.api.libs.ws.{WSAuthScheme, WSClient}

import scala.collection.concurrent.TrieMap
import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

@Singleton
class ClusterMetadataResolver @Inject() (client: WSClient)(implicit ec: ExecutionContext) {

  private val ttl: FiniteDuration = 5.minutes
  private val cache = TrieMap.empty[String, CachedEntry]

  def resolve(target: ElasticServer): Future[ClusterMetadata] = {
    val key = cacheKey(target)
    cache.get(key) match {
      case Some(entry) if !entry.isExpired => Future.successful(entry.metadata)
      case _ =>
        fetch(target).map { case (md, raw) =>
          if (md.distribution != Distribution.Unknown) {
            cache.put(key, CachedEntry(md, deadline(), raw))
          }
          md
        }.recover { case _ => ClusterMetadata.Unknown }
    }
  }

  def invalidate(target: ElasticServer): Unit =
    cache.remove(cacheKey(target))

  def invalidateAll(): Unit =
    cache.clear()

  private def fetch(target: ElasticServer): Future[(ClusterMetadata, JsValue)] = {
    val authentication = target.host.authentication
    val url = s"${target.host.name.replaceAll("/+$", "")}/"
    val mergedHeaders = target.headers
    val request = authentication.foldLeft(client.url(url).withMethod("GET").withHttpHeaders(mergedHeaders: _*)) {
      case (req, auth) => req.withAuth(auth.username, auth.password, WSAuthScheme.BASIC)
    }
    request.execute().map { response =>
      val productHeader = response.header("X-Elastic-Product")
      val body =
        if (response.status >= 200 && response.status < 300) {
          try Json.parse(response.body) catch { case _: Throwable => Json.obj() }
        } else Json.obj()
      val md = ClusterMetadata.parse(body, productHeader)
      (md, body)
    }
  }

  private def cacheKey(target: ElasticServer): String = {
    val authPart = target.host.authentication.map(a => s"${a.username}@").getOrElse("")
    s"$authPart${target.host.name}"
  }

  private def deadline(): Long = System.currentTimeMillis() + ttl.toMillis

  private case class CachedEntry(metadata: ClusterMetadata, expiresAt: Long, raw: JsValue) {
    def isExpired: Boolean = System.currentTimeMillis() > expiresAt
  }
}
