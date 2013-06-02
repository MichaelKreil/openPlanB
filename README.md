
**1. Forken oder runterladen**

Neben dem Decoder werden auch die entsprechenden [Hafas-Offline-Versionen](https://github.com/MichaelKreil/openPlanB/wiki/Hafas-Offline-Versionen) benötigt. Diese einfach entpacken (z.b. mit ZIP), bis die plan-Dateien zum Vorschein kommen.

<br>

**2. Konfigurieren**

Die config.json.tmpl sollte man nach config.json kopieren und dort bei Bedarf die Pfade anpassen. Die Pfade sind relativ zum Pfad, in dem config.json liegt. Am wichtigsten ist sicherlich der Parameter "planFolder", da sollte das Verzeichnis mit den plan-Dateien eingetragen sein.

<br>

**3. Konvertieren**

Momentan haben wir mindestens vier Skripte, die Daten extrahieren:

* **decode.js** erzeugt TSV- (tab separated values) und JSON-Dateien im 'decodeFolder'; das sind fast alle Rohdaten, die in den Plan-Dateien stehen.
* **makeGTFS.js** erzeugt GTFS-Dateien im 'gtfsFolder', momentan aber noch unvollständig
* **scheduleByTrain.js** erzeugt eine Datei mit Fahrplan-Daten, das war ein erster Versuch alle Fahrplan-Daten aus den verschiedenen Plan-Quellen zu aggregieren; das Ergebnis ist vielleicht zum Debuggen der Datenextraktion gut, aber sonst nicht sinnvoll.
* **exportTrains.js** erzeugt für jeden Zug einen möglichst ausführlichen und vollständigen Fahrplan als .txt-Datei im 'decodeFolder', Unterverzeichnis 'trains'


Jedes der Skripte kann man einfach mit `node SKRIPTNAME` also bspw. `node decode.js` ausführen. Es wird kein Server gestartet, sondern das JavaScript wird einfach ausgeführt.

<br>

**Weitere Informationen**

... gibt es im Blog: <http://openplanb.tumblr.com>,

auf Twitter: <http://twitter.com/openPlanB>

und im Developer-Forum auf: <https://groups.google.com/d/forum/openplanb>