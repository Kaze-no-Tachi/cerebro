package elastic

import org.specs2.Specification
import play.api.libs.json.{JsObject, JsValue, Json}

object ClusterMetadataSpec extends Specification {

  def is =
    s2"""
    ClusterMetadata.parse should
        identify Elasticsearch 6.8                          $detectsES68
        identify Elasticsearch 7.17                         $detectsES717
        identify Elasticsearch 8.x                          $detectsES8
        identify Elasticsearch 9.x                          $detectsES9
        identify OpenSearch 1.x via distribution field      $detectsOS1
        identify OpenSearch 2.x via distribution field      $detectsOS2
        identify OpenSearch 3.x via distribution field      $detectsOS3
        fall back to Elasticsearch when only number is set  $fallbackES
        fall back to product header when body is empty      $fallbackHeader
        return Unknown when nothing identifies the cluster  $unknown

    ClusterMetadata helpers should
        flag isES8Plus correctly                            $es8Plus
        flag supportsTypes for ES <= 6                      $typesOnES6
        flag usesClusterManager for OS >= 2                 $clusterManager
      """

  private def root(distribution: Option[String], number: String): JsValue = {
    val versionFields: Seq[(String, JsValue)] =
      Seq("number" -> Json.toJson(number)) ++ distribution.map(d => "distribution" -> Json.toJson(d)).toSeq
    Json.obj("version" -> JsObject(versionFields))
  }

  private def detectsES68 = {
    val md = ClusterMetadata.parse(root(None, "6.8.23"), Some("Elasticsearch"))
    (md.distribution must_=== Distribution.Elasticsearch) and
      (md.major must_=== 6) and (md.minor must_=== 8) and (md.patch must_=== 23) and
      (md.supportsTypes must beTrue) and (md.isES7Plus must beFalse)
  }

  private def detectsES717 = {
    val md = ClusterMetadata.parse(root(None, "7.17.27"), Some("Elasticsearch"))
    (md.distribution must_=== Distribution.Elasticsearch) and
      (md.major must_=== 7) and (md.isES7Plus must beTrue) and
      (md.isES8Plus must beFalse) and (md.supportsTypes must beFalse)
  }

  private def detectsES8 = {
    val md = ClusterMetadata.parse(root(None, "8.17.0"), Some("Elasticsearch"))
    (md.distribution must_=== Distribution.Elasticsearch) and
      (md.major must_=== 8) and (md.isES8Plus must beTrue)
  }

  private def detectsES9 = {
    val md = ClusterMetadata.parse(root(None, "9.0.0"), Some("Elasticsearch"))
    (md.distribution must_=== Distribution.Elasticsearch) and
      (md.major must_=== 9) and (md.isES8Plus must beTrue)
  }

  private def detectsOS1 = {
    val md = ClusterMetadata.parse(root(Some("opensearch"), "1.3.20"), None)
    (md.distribution must_=== Distribution.OpenSearch) and
      (md.major must_=== 1) and (md.isES8Plus must beFalse) and
      (md.usesClusterManager must beFalse)
  }

  private def detectsOS2 = {
    val md = ClusterMetadata.parse(root(Some("opensearch"), "2.18.0"), None)
    (md.distribution must_=== Distribution.OpenSearch) and
      (md.major must_=== 2) and (md.usesClusterManager must beTrue)
  }

  private def detectsOS3 = {
    val md = ClusterMetadata.parse(root(Some("opensearch"), "3.0.0"), None)
    (md.distribution must_=== Distribution.OpenSearch) and
      (md.major must_=== 3) and (md.usesClusterManager must beTrue)
  }

  private def fallbackES = {
    val md = ClusterMetadata.parse(root(None, "8.5.2"), None)
    md.distribution must_=== Distribution.Elasticsearch
  }

  private def fallbackHeader = {
    val md = ClusterMetadata.parse(Json.obj(), Some("Elasticsearch"))
    md.distribution must_=== Distribution.Elasticsearch
  }

  private def unknown = {
    val md = ClusterMetadata.parse(Json.obj(), None)
    md.distribution must_=== Distribution.Unknown
  }

  private def es8Plus = {
    val es7 = ClusterMetadata.parse(root(None, "7.17.0"), Some("Elasticsearch"))
    val es8 = ClusterMetadata.parse(root(None, "8.0.0"), Some("Elasticsearch"))
    val os3 = ClusterMetadata.parse(root(Some("opensearch"), "3.0.0"), None)
    (es7.isES8Plus must beFalse) and (es8.isES8Plus must beTrue) and (os3.isES8Plus must beFalse)
  }

  private def typesOnES6 = {
    val es5 = ClusterMetadata.parse(root(None, "5.6.16"), Some("Elasticsearch"))
    val es6 = ClusterMetadata.parse(root(None, "6.8.23"), Some("Elasticsearch"))
    val es7 = ClusterMetadata.parse(root(None, "7.0.0"), Some("Elasticsearch"))
    (es5.supportsTypes must beTrue) and (es6.supportsTypes must beTrue) and (es7.supportsTypes must beFalse)
  }

  private def clusterManager = {
    val os1 = ClusterMetadata.parse(root(Some("opensearch"), "1.3.20"), None)
    val os2 = ClusterMetadata.parse(root(Some("opensearch"), "2.0.0"), None)
    val es8 = ClusterMetadata.parse(root(None, "8.0.0"), Some("Elasticsearch"))
    (os1.usesClusterManager must beFalse) and (os2.usesClusterManager must beTrue) and
      (es8.usesClusterManager must beFalse)
  }
}
