package elastic

import play.api.libs.json.{JsString, JsValue, Json}
import play.api.libs.ws.WSResponse

import scala.util.Try

sealed trait ElasticResponse {

  val status: Int

  val body: JsValue

}

case class Success(status: Int, body: JsValue) extends ElasticResponse

case class Error(status: Int, body: JsValue) extends ElasticResponse

object ElasticResponse {

  def isSuccess(status: Int): Boolean = status >= 200 && status < 300

  def apply(response: WSResponse): ElasticResponse = {
    // Cat plaintext (e.g. `_cat/nodes?v`) and similar non-JSON endpoints
    // arrive here with `response.body` as plain text. .json throws in that
    // case, so fall back to wrapping the raw body in a JsString so callers
    // can still render it.
    if (isSuccess(response.status)) {
      val body = Try(response.json).getOrElse(JsString(response.body))
      Success(response.status, body)
    } else {
      val body = Try(response.json).getOrElse(Json.obj("error" -> JsString(response.body)))
      Error(response.status, body)
    }
  }

}
