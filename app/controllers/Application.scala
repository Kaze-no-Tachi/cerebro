package controllers

import com.google.inject.Inject
import controllers.auth.AuthenticationModule
import play.api.Environment
import play.api.mvc.InjectedController

import scala.io.Source

class Application @Inject()(env: Environment, val authentication: AuthenticationModule) extends InjectedController with AuthSupport {

  def index = AuthAction(authentication, true)(defaultExecutionContext) { request =>
    Ok(views.html.Index())
  }

  // Serves the new Vue / PrimeVue SPA shell. The built bundle lives under
  // public/dist/ (produced by `cd frontend && npm run build`, then copied
  // into the Play app's public/ directory). Any /next/<path> request that
  // isn't a static asset returns the same index.html and lets vue-router
  // handle client-side routing.
  def next(path: String = "") = AuthAction(authentication, true)(defaultExecutionContext) { _ =>
    env.resourceAsStream("public/dist/index.html") match {
      case Some(stream) =>
        try Ok(Source.fromInputStream(stream).mkString).as("text/html; charset=utf-8")
        finally stream.close()
      case None =>
        NotFound(
          "The /next SPA bundle has not been built yet.\n\n" +
            "Run:\n" +
            "  cd frontend && npm install && npm run build\n" +
            "  cp -r dist/* ../public/dist/\n\n" +
            "Then reload."
        )
    }
  }

}
