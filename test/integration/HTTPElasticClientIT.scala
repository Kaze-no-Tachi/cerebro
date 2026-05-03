package integration

import elastic.{ClusterMetadataResolver, Distribution, HTTPElasticClient}
import models.{ElasticServer, Host}
import org.specs2.Specification
import org.specs2.specification.AfterAll
import play.api.Application
import play.api.inject.guice.GuiceApplicationBuilder
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext}

/**
  * Integration test exercising HTTPElasticClient against real Elasticsearch and
  * OpenSearch containers brought up via docker-compose.test.yml. Gated on
  * CEREBRO_IT=1; otherwise the spec is a no-op so plain `sbt test` is unaffected.
  *
  * Run with:
  *   docker compose -f docker-compose.test.yml up -d --wait
  *   CEREBRO_IT=1 sbt 'testOnly *IT'
  */
object HTTPElasticClientIT extends Specification with AfterAll {

  private val enabled = sys.env.get("CEREBRO_IT").contains("1")

  private case class Target(name: String, url: String, expected: Distribution, expectedMajor: Int)

  private val targets: Seq[Target] = Seq(
    Target("es68",  "http://localhost:9268", Distribution.Elasticsearch, 6),
    Target("es717", "http://localhost:9217", Distribution.Elasticsearch, 7),
    Target("es8",   "http://localhost:9280", Distribution.Elasticsearch, 8),
    Target("es9",   "http://localhost:9290", Distribution.Elasticsearch, 9),
    Target("os3",   "http://localhost:9300", Distribution.OpenSearch,    3)
  )

  // Build a Play Application so we get a fully wired WSClient (with its own
  // Pekko system + materializer) without having to assemble those pieces by
  // hand. The application is stopped in afterAll().
  private lazy val app: Application = new GuiceApplicationBuilder().build()
  private lazy val ws: WSClient     = app.injector.instanceOf[WSClient]
  private lazy val ec: ExecutionContext = app.injector.instanceOf[ExecutionContext]

  private lazy val resolver = new ClusterMetadataResolver(ws)(ec)
  private lazy val client   = new HTTPElasticClient(ws, resolver)

  override def afterAll(): Unit = if (enabled) {
    Await.result(app.stop(), 30.seconds)
    ()
  }

  def is = if (enabled) {
    s2"""
    HTTPElasticClient should
      identify es68 as Elasticsearch 6                ${verify(targets(0))}
      identify es717 as Elasticsearch 7               ${verify(targets(1))}
      identify es8 as Elasticsearch 8                 ${verify(targets(2))}
      identify es9 as Elasticsearch 9                 ${verify(targets(3))}
      identify os3 as OpenSearch 3                    ${verify(targets(4))}
    """
  } else s2"""
    HTTPElasticClient integration tests are skipped (set CEREBRO_IT=1 to enable) $skip
    """

  private def skip = success

  private def verify(t: Target) = {
    val server = ElasticServer(Host(t.url))
    val md          = Await.result(resolver.resolve(server), 30.seconds)
    val indicesResp = Await.result(client.getIndices(server), 30.seconds)
    val masterResp  = Await.result(client.catMaster(server), 30.seconds)

    (md.distribution must_=== t.expected) and
      (md.major must_=== t.expectedMajor) and
      (indicesResp.status must_=== 200) and
      (masterResp.status must_=== 200)
  }
}
