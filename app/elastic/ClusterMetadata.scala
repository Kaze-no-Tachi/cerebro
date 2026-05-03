package elastic

import play.api.libs.json.{JsNull, JsValue}

import scala.util.Try

sealed trait Distribution
object Distribution {
  case object Elasticsearch extends Distribution
  case object OpenSearch    extends Distribution
  case object Unknown       extends Distribution
}

final case class ClusterMetadata(
  distribution: Distribution,
  major: Int,
  minor: Int,
  patch: Int,
  buildFlavor: Option[String],
  raw: JsValue
) {
  def isElasticsearch: Boolean = distribution == Distribution.Elasticsearch
  def isOpenSearch: Boolean    = distribution == Distribution.OpenSearch
  def isUnknown: Boolean       = distribution == Distribution.Unknown

  def isES8Plus: Boolean       = isElasticsearch && major >= 8
  def isES7Plus: Boolean       = isElasticsearch && major >= 7
  def supportsTypes: Boolean   = isElasticsearch && major <= 6

  def usesClusterManager: Boolean = isOpenSearch && major >= 2
}

object ClusterMetadata {

  val Unknown: ClusterMetadata =
    ClusterMetadata(Distribution.Unknown, 0, 0, 0, None, JsNull)

  def parse(rootResponse: JsValue, productHeader: Option[String]): ClusterMetadata = {
    val distribution = (rootResponse \ "version" \ "distribution").asOpt[String]
      .map(_.toLowerCase) match {
        case Some("opensearch")    => Distribution.OpenSearch
        case Some("elasticsearch") => Distribution.Elasticsearch
        case _ =>
          productHeader.map(_.toLowerCase) match {
            case Some(h) if h.contains("opensearch")    => Distribution.OpenSearch
            case Some(h) if h.contains("elasticsearch") => Distribution.Elasticsearch
            case _ if (rootResponse \ "version" \ "number").asOpt[String].isDefined =>
              Distribution.Elasticsearch
            case _ => Distribution.Unknown
          }
      }

    val versionString = (rootResponse \ "version" \ "number").asOpt[String].getOrElse("")
    val (major, minor, patch) = parseSemver(versionString)
    val buildFlavor = (rootResponse \ "version" \ "build_flavor").asOpt[String]

    ClusterMetadata(distribution, major, minor, patch, buildFlavor, rootResponse)
  }

  private def parseSemver(version: String): (Int, Int, Int) = {
    val numeric = version.takeWhile(c => c.isDigit || c == '.')
    val parts = numeric.split('.').toList
    val major = parts.headOption.flatMap(s => Try(s.toInt).toOption).getOrElse(0)
    val minor = parts.drop(1).headOption.flatMap(s => Try(s.toInt).toOption).getOrElse(0)
    val patch = parts.drop(2).headOption.flatMap(s => Try(s.toInt).toOption).getOrElse(0)
    (major, minor, patch)
  }
}
