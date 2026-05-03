name := "cerebro"

maintainer := "Leonardo Menezes <leonardo.menezes@xing.com>"

packageSummary := "Elasticsearch web admin tool"

packageDescription := """cerebro is an open source(MIT License) elasticsearch web admin tool built
  using Scala, Play Framework, AngularJS and Bootstrap."""

version := "0.10.0"

scalaVersion := "2.13.18"

scalacOptions ++= Seq("-release", "11")
javacOptions  ++= Seq("-source", "11", "-target", "11")

rpmVendor := "lmenezes"

rpmLicense := Some("MIT")

rpmUrl := Some("http://github.com/lmenezes/cerebro")

libraryDependencies ++= Seq(
  "com.typesafe.play" %% "play"                    % "2.9.10",
  "com.typesafe.play" %% "play-json"               % "2.10.6",
  "com.typesafe.play" %% "play-slick"              % "5.3.0",
  "com.typesafe.play" %% "play-slick-evolutions"   % "5.3.0",
  "org.xerial"        %  "sqlite-jdbc"             % "3.46.1.3",
  "org.specs2"        %% "specs2-junit"  % "4.20.9" % Test,
  "org.specs2"        %% "specs2-core"   % "4.20.9" % Test,
  "org.specs2"        %% "specs2-mock"   % "4.20.9" % Test
)

libraryDependencies += filters
libraryDependencies += ws
libraryDependencies += guice

lazy val root = (project in file(".")).
  enablePlugins(PlayScala, BuildInfoPlugin, LauncherJarPlugin, JDebPackaging, RpmPlugin).
  settings(
    buildInfoKeys := Seq[BuildInfoKey](name, version, scalaVersion, sbtVersion),
    buildInfoPackage := "models"
  )

Compile / doc / sources := Seq.empty

enablePlugins(JavaServerAppPackaging)
enablePlugins(SystemdPlugin)

pipelineStages := Seq(digest, gzip)

Debian / systemdSuccessExitStatus += "143"
Rpm    / systemdSuccessExitStatus += "143"
linuxPackageMappings += packageTemplateMapping(s"/var/lib/${packageName.value}")() withUser((Linux / daemonUser).value) withGroup((Linux / daemonGroup).value)
