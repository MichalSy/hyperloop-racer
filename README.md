# Hyperloop Racer

## 1. Einleitung

### 1.1 Zweck des Dokuments
Dieses Lastenheft definiert die technischen und funktionalen Anforderungen an den "Hyperloop Racer Track Editor". Es dient als umfassende Anleitung für eine KI oder Entwickler zur Umsetzung des Projekts.

### 1.2 Projektübersicht
"Hyperloop Racer" ist ein Streckenbau-Editor mit Testmöglichkeit für ein 3D-Rennspiel im Weltraum. Das Projekt umfasst zwei Hauptmodi: einen Editor zum Entwerfen von Strecken und einen Testmodus zum Befahren der erstellten Strecken. Es wird als Single Page Application (SPA) für moderne Webbrowser mit Vite und Babylon.js entwickelt und bietet eine dynamische Gravitationsphysik, bei der die Gravitation immer zur Strecke zeigt.

### 1.3 Definitionen, Akronyme und Abkürzungen
- **SPA**: Single Page Application
- **WebGL**: Web Graphics Library, JavaScript-API zum Rendern von 3D-Grafiken im Browser
- **TypeScript**: Typisierte Obermenge von JavaScript
- **Vite**: Build-Tool und Entwicklungsserver für Web-Anwendungen
- **Hyperloop**: Basiert auf dem Konzept eines Hochgeschwindigkeits-Transportsystems, hier adaptiert für ein Weltraum-Rennspiel
- **Dynamische Gravitation**: Physikmodell, bei dem die Gravitationsrichtung variabel ist und sich an die Rennstrecke anpasst
- **Cubik**: Die Grundeinheit des Streckenrasters mit einer Größe von 10x10x10 Einheiten
- **Konnektor**: Verbindungspunkt an einer Cubik-Seite, an dem Streckenelemente verbunden werden können
- **Checkpoint**: Zusätzlicher Kontrollpunkt zwischen Ein- und Ausgang zur Steuerung des Streckenverlaufs
- **Spline**: Glatte Kurve, die durch definierte Punkte verläuft

## 2. Technologieanalyse

### 2.1 Frontend-Stack
- **TypeScript**: Als Hauptprogrammiersprache für Typsicherheit und bessere Wartbarkeit
- **Vite**: Als Build-Tool und Entwicklungsserver für schnelle Entwicklung
- **Babylon.js 5.0+**: Als 3D-Engine mit WebGL-Unterstützung und anpassbarer Physik
- **localStorage API**: Für die lokale Speicherung von Streckendaten

### 2.2 Babylon.js als Primäre Engine
Babylon.js wurde aufgrund folgender Eigenschaften ausgewählt:
- Native TypeScript-Unterstützung (in TypeScript entwickelt)
- Vollwertige 3D Game Engine für WebGL
- Eingebautes Physiksystem mit anpassbarer Gravitation
- Umfangreiche Dokumentation und aktive Community
- Optimiert für Browser-Performance
- GUI-System für Editor-Funktionalitäten
- Integrierte Kollisionserkennung

## 3. Funktionale Anforderungen

### 3.1 Modi
- **F1**: Die Anwendung muss zwei Hauptmodi unterstützen: Editormodus und Testmodus.
  - Priorität: Hoch
  - Details: Klare Trennung zwischen Streckeneditor und Testsimulation.

### 3.2 Editormodus
- **F2**: Der Editormodus muss zwei Submodi enthalten: Elementdesigner und Streckenassembler.
  - Priorität: Hoch
  - Details: Möglichkeit zum Wechseln zwischen den Modi über eine UI.

- **F3**: Der Elementdesigner muss das Erstellen individueller Streckenelemente in einem dreidimensionalen Raster ermöglichen.
  - Priorität: Hoch
  - Details: Bearbeitung basierend auf Cubiks mit 10x10x10-Größe.

- **F4**: Streckenelemente müssen in Vielfachen der Basisgröße (10 Einheiten) erstellt werden können.
  - Priorität: Hoch
  - Details: Beispiele: 10x10x10, 20x10x10, 10x20x30, etc.

- **F5**: Jede Seite eines Cubiks muss 5 Konnektorpunkte in einer "Plus"-Formation haben (Mitte der Seite und Mitte jeder Kante).
  - Priorität: Hoch
  - Details: Diese Konnektoren dienen zum Verbinden verschiedener Streckenelemente.

- **F5.1**: Jeder Konnektor muss eine eigene "nach oben" Orientierung speichern und visualisieren.
  - Priorität: Hoch
  - Details: Eine Kugel repräsentiert den Konnektor, ein Pfeil zeigt die Orientierung an.

- **F5.2**: Die Orientierung jedes Konnektors muss in 90°-Schritten in alle drei Raumrichtungen änderbar sein.
  - Priorität: Hoch
  - Details: Über UI-Steuerelemente in Form von Richtungspfeilen.

- **F5.3**: Jedes Streckenelement muss mindestens einen Eingangs- und einen Ausgangskonnektor haben.
  - Priorität: Hoch
  - Details: Diese können durch Drag & Drop zwischen den verfügbaren Konnektoren verschoben werden.

- **F5.4**: Zusätzliche Konnektoren müssen als Checkpoints definierbar sein, um den Streckenverlauf zu steuern.
  - Priorität: Mittel
  - Details: Ein Spline verbindet alle Konnektoren vom Eingang über Checkpoints bis zum Ausgang.

- **F6**: Der Streckenassembler muss das Zusammenfügen verschiedener Streckenelemente über die Konnektoren ermöglichen.
  - Priorität: Hoch
  - Details: Drag-and-Drop-Funktionalität mit Einrasten an Konnektoren.

### 3.3 Testmodus
- **F7**: Der Testmodus muss das Befahren der erstellten Strecke mit einem Fahrzeug ermöglichen.
  - Priorität: Hoch
  - Details: Grundlegende Fahrzeugsteuerung mit Tastatur.

- **F8**: Die Gravitation muss dynamisch an die Strecke angepasst sein, sodass das Fahrzeug immer auf der Strecke "haftet".
  - Priorität: Hoch
  - Details: Implementierung eines benutzerdefinierten Gravitationssystems.

- **F9**: Der Testmodus muss die Zeit für die Streckenbefahrung messen und Bestzeiten speichern.
  - Priorität: Mittel
  - Details: Start-/Ziellinie, Zeitanzeige, Bestenliste.

### 3.4 Speichern und Teilen
- **F10**: Die erstellten Strecken müssen im localStorage des Browsers gespeichert werden können.
  - Priorität: Hoch
  - Details: Automatisches Speichern und Laden von Streckendaten.

- **F11**: Die Anwendung muss das Exportieren und Importieren von Strecken unterstützen.
  - Priorität: Hoch
  - Details: Export als Zip-Datei mit der Strecke und allen benötigten Streckenelementen.

- **F11.1**: Der Nutzer muss beim Export zwischen verschiedenen Optionen wählen können.
  - Priorität: Mittel
  - Details: Option zum Export der Strecke allein oder der Strecke inklusive aller benötigten Streckenelemente.

- **F12**: Die JSON-Dateien müssen auch Bestzeiten enthalten.
  - Priorität: Mittel
  - Details: Strukturierte Speicherung von Strecke und zugehörigen Daten.
  
- **F13**: Einzelne Streckenelemente müssen als JSON-Dateien exportierbar sein.
  - Priorität: Hoch
  - Details: Die exportierten Dateien müssen so strukturiert sein, dass sie direkt in den Quellcode der Anwendung integriert werden können.

## 4. Nicht-funktionale Anforderungen

### 4.1 Leistung und Effizienz
- **NF1**: Die Anwendung muss mit mindestens 60 FPS auf aktuellen Browsern laufen.
  - Priorität: Hoch
  - Details: Optimierung von 3D-Modellen, Shader-Code und Physikberechnungen.

- **NF2**: Die Anwendung muss innerhalb von maximal 3 Sekunden vollständig geladen werden (bei einer Internetverbindung von mindestens 10 Mbit/s).
  - Priorität: Mittel
  - Details: Implementierung von Asset-Kompression und progressivem Laden.

### 4.2 Zuverlässigkeit und Datensicherheit
- **NF3**: Die Anwendung muss regelmäßig automatisch speichern, um Datenverlust zu vermeiden.
  - Priorität: Hoch
  - Details: Auto-Save-Funktion alle 30 Sekunden.

- **NF4**: Die Anwendung muss eine Versionierungsfunktion für Streckenelemente und -layouts bieten.
  - Priorität: Niedrig
  - Details: Speichern mehrerer Versionen mit Zeitstempel.

### 4.3 Benutzerfreundlichkeit
- **NF5**: Die Anwendung muss eine intuitive Benutzeroberfläche für den Editor bieten.
  - Priorität: Hoch
  - Details: Klare Icons, Drag-and-Drop-Funktionalität, Kontextmenüs.

- **NF6**: Der Testmodus muss eine intuitive Steuerung des Fahrzeugs ermöglichen.
  - Priorität: Hoch
  - Details: Standardsteuerung (WASD/Pfeiltasten), anpassbare Steuerung.

### 4.4 Wartbarkeit
- **NF7**: Der Code muss modular und gut dokumentiert sein.
  - Priorität: Hoch
  - Details: Verwendung von TypeScript-Interfaces, JSDoc-Kommentaren und einer klaren Verzeichnisstruktur.

## 5. Technische Spezifikation

### 5.1 Streckenmodell
- **TS1**: Das Streckensystem basiert auf Cubiks mit einer Größe von 10x10x10 Einheiten.
  - Details: Diese bilden die Grundeinheit für alle Streckenelemente.

- **TS2**: Jede Cubik-Seite hat 5 Konnektoren in einer "Plus"-Formation: einen in der Mitte der Seite und einen in der Mitte jeder Kante.
  - Details: Diese dienen als Verbindungspunkte zwischen Streckenelementen. Jeder Konnektor speichert eine "nach oben" Orientierung.

- **TS3**: Streckenelemente können in Vielfachen der Basisgröße erstellt werden.
  - Details: Größen wie 10x10x10, 20x10x10, 10x20x30 sind möglich, immer in 10er-Schritten.

### 5.2 Datenmodell
- **TS4**: Streckenelemente werden als JSON-Objekte mit folgender Struktur gespeichert:
  - ID: Eindeutige Kennung
  - Name: Benutzerfreundlicher Name
  - Dimensionen: Größe in [x, y, z]
  - Konnektoren: Liste von Konnektoren mit:
    - Position: [x, y, z]
    - Normale: Ausrichtung der Verbindungsfläche
    - "Oben"-Vektor: Orientierung
    - Typ: Eingang/Ausgang/Checkpoint

- **TS5**: Streckendaten werden als JSON-Objekte mit folgender Struktur gespeichert:
  - ID: Eindeutige Kennung
  - Name: Benutzerfreundlicher Name
  - Autor: Name des Erstellers
  - Erstellungsdatum: Zeitstempel
  - Änderungsdatum: Zeitstempel
  - Elemente: Liste von Streckenelementen mit Position und Rotation
  - Bestzeiten: Liste von Bestzeiten mit Spielername, Zeit und Datum

### 5.3 Konnektor-System

- **TS8**: Jeder Konnektor besteht aus einer Kugel (Sphere) und einem Pfeil.
  - Details: Die Kugel repräsentiert den Verbindungspunkt, der Pfeil zeigt die "Oben"-Orientierung an.

- **TS9**: Jedes Streckenelement muss mindestens zwei Konnektoren haben (Eingang und Ausgang).
  - Details: Weitere Konnektoren können als Checkpoints hinzugefügt werden, um den Spline-Kurvenverlauf zu verbessern.

- **TS10**: Die Konnektor-Orientierung muss in 90°-Schritten in alle drei Raumrichtungen rotierbar sein.
  - Details: UI-Steuerelemente (Pfeile) ermöglichen die Rotation um die X-, Y- und Z-Achse.

- **TS11**: Zwischen Konnektoren wird eine dreidimensionale Strecke erzeugt, die den Streckenverlauf darstellt.
  - Details: Die Strecke folgt der Reihenfolge: Eingang → Checkpoints → Ausgang, hat eine Dicke von 1 Einheit und eine Breite von 10 Einheiten.
  - Details: Farbgebung: Regenbogen-Textur auf der Oberseite, rote Unterseite, graue Seitenflächen.

### 5.4 Physikmodell
- **TS6**: Die Physik basiert auf Babylon.js Physics mit einem benutzerdefinierten Gravitationssystem.
  - Details: Gravitation wird immer in Richtung der nächsten Streckenoberfläche berechnet.

- **TS7**: Das Fahrzeug folgt einem vereinfachten Physikmodell mit Beschleunigung, Bremsen und Lenkung.
  - Details: Keine komplexe Fahrphysik, fokussiert auf Spielbarkeit.

## 6. Implementierungsleitfaden (für KI)

### 6.1 Projekteinrichtung
1. Erstellen Sie ein neues Projekt mit Vite und TypeScript
   - Nutzen Sie den TypeScript-Template von Vite
   - Installieren Sie Babylon.js Kernmodule und Erweiterungen
   - Konfigurieren Sie Vite für optimale Entwicklung und Produktion

2. Konfigurieren Sie die package.json mit folgenden Scripts:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "tsc && vite build",
     "preview": "vite preview",
     "start:editor": "vite --mode editor",
     "start:test": "vite --mode test"
   }
   ```

3. Erstellen Sie Konfigurationsdateien für verschiedene Modi:
   - `.env.editor` für den Editor-Modus
   - `.env.test` für den Test-Modus
   - Definieren Sie in diesen Dateien den Startmodus: `VITE_START_MODE=editor` bzw. `VITE_START_MODE=test`

4. Implementieren Sie Hot-Reload für die Entwicklung:
   - Nutzen Sie die eingebauten Hot-Module-Replacement-Funktionen von Vite
   - Stellen Sie sicher, dass der Anwendungszustand bei Code-Änderungen erhalten bleibt
   - Implementieren Sie einen Status-Manager, der den aktuellen Bearbeitungszustand speichert

5. Konfigurieren Sie eine GitHub Actions Pipeline für die automatische Bereitstellung:
   - Erstellen Sie eine Workflow-Datei unter `.github/workflows/deploy.yml`
   - Implementieren Sie einen Build- und Deployment-Prozess für GitHub Pages
   - Stellen Sie sicher, dass die kompilierte Version im selben Repository veröffentlicht wird
   - Konfigurieren Sie die Pipeline so, dass sie bei Änderungen im `main`-Branch ausgelöst wird

6. Erstellen Sie eine strukturierte Projektorganisation mit folgenden Hauptordnern:
   - src/: Quelldateien
   - assets/: 3D-Modelle, Texturen und Audiodateien
   - src/app/: Hauptanwendungsklassen
   - src/editor/: Editor-Module
   - src/test/: Testmodus-Module
   - src/track/: Strecken- und Elementdefinitionen
   - src/engine/: Babylon.js-Wrapper und Physik
   - src/utils/: Hilfsfunktionen und -klassen

### 6.2 Implementierung des Cubik- und Konnektor-Systems

**Implementierungsanweisungen für das Konnektor-System:**

1. **Konnektor-Darstellung**
   - Erstellen Sie eine Klasse `Connector`, die einen Verbindungspunkt repräsentiert
   - Jeder Konnektor besteht aus einer Kugel (Sphere) mit einem Durchmesser von 0.5 Einheiten
   - Implementieren Sie einen Pfeil, der die "Oben"-Orientierung des Konnektors anzeigt
   - Der Pfeil soll eine Länge von 1 Einheit haben und von der Kugel in Richtung des "upVector" zeigen

2. **Konnektor-Positionierung**
   - Positionieren Sie die Konnektoren in einer "Plus"-Formation auf jeder Cubik-Seite
   - Ein Konnektor in der Mitte der Seite
   - Vier Konnektoren in der Mitte jeder Kante der Seite
   - Die genaue Position soll relativ zur Cubik-Größe berechnet werden

3. **Konnektor-Typen**
   - Implementieren Sie die Konnektor-Typen (ENTRY, EXIT, CHECKPOINT)
   - Kennzeichnen Sie die Typen durch unterschiedliche Farben:
     - Eingang (ENTRY): Grün
     - Ausgang (EXIT): Rot
     - Checkpoint: Gelb
   - Gestalten Sie das System erweiterbar, sodass in Zukunft weitere spezielle Typen hinzugefügt werden können

4. **Konnektor-Orientierung**
   - Speichern Sie für jeden Konnektor einen "upVector", der die Orientierung angibt
   - Implementieren Sie UI-Steuerelemente für die Rotation der Orientierung
   - Erstellen Sie drei Schaltflächen für die Rotation um X-, Y- und Z-Achse
   - Jeder Klick rotiert den upVector um 90° in die entsprechende Richtung

5. **Konnektor-Interaktion**
   - Ermöglichen Sie die Auswahl von Konnektoren durch Klicken
   - Implementieren Sie Drag & Drop-Funktionalität zum Verschieben von Konnektoren
   - Erlauben Sie das Zuweisen von Typen zu Konnektoren per UI
   - Implementieren Sie das Rotieren der Orientierung über die UI-Steuerelemente

6. **Streckengenerierung**
   - Erstellen Sie eine Funktion zum Erzeugen einer Strecke zwischen Konnektoren
   - Die Strecke soll vom Eingangskonnektor über alle Checkpoints zum Ausgangskonnektor verlaufen
   - Die Strecke muss eine Dicke von 1 Einheit und eine Breite von 10 Einheiten haben
   - Farbgebung der Strecke: Regenbogen-Textur auf der Oberseite, rote Unterseite, graue Seitenflächen
   - Berücksichtigen Sie die Position und Orientierung jedes Konnektors bei der Streckengenerierung
   - Die generierte Strecke dient als visuelle Darstellung der Fahrbahn und als Grundlage für die Physik

7. **Validierung**
   - Prüfen Sie, ob jedes Streckenelement mindestens einen Eingangs- und einen Ausgangskonnektor hat
   - Validieren Sie die Orientierungen auf Konsistenz
   - Stellen Sie sicher, dass die Strecke eine sinnvolle Verbindung bildet

### 6.3 Implementierung des Elementdesigners

1. **Benutzeroberfläche**
   - Erstellen Sie eine UI mit Werkzeugen für die Bearbeitung von Streckenelementen
   - Implementieren Sie Steuerelemente zur Anpassung der Elementgröße
   - Erstellen Sie eine Vorschauansicht für das aktuell bearbeitete Element
   - Fügen Sie Schaltflächen zum Speichern, Laden und Löschen von Elementen hinzu

2. **Elementbearbeitung**
   - Implementieren Sie Funktionen zum Erstellen neuer Streckenelemente mit anpassbaren Dimensionen
   - Ermöglichen Sie das Hinzufügen und Entfernen von Konnektoren an zulässigen Positionen
   - Implementieren Sie die Funktionalität zum Ändern der Typen und Orientierungen von Konnektoren
   - Erstellen Sie Werkzeuge zum Bearbeiten der Geometrie des Streckenelements

3. **Streckengenerierung**
   - Implementieren Sie die automatische Generierung einer dreidimensionalen Strecke zwischen Konnektoren
   - Die Strecke soll eine Dicke von 1 Einheit und eine Breite von 10 Einheiten haben
   - Erstellen Sie eine Regenbogen-Textur für die Oberseite der Strecke
   - Farbgebung der Strecke: Regenbogen-Textur auf der Oberseite, rote Unterseite, graue Seitenflächen
   - Die Strecke soll die Reihenfolge Eingang → Checkpoints → Ausgang einhalten
   - Die Konnektor-Orientierungen sollen bei der Streckengenerierung berücksichtigt werden
   - Ermöglichen Sie eine Vorschau der Strecke im Editor

4. **Validierung**
   - Implementieren Sie Prüfungen zur Sicherstellung, dass jedes Element mindestens einen Eingang und einen Ausgang hat
   - Überprüfen Sie die Konsistenz und Gültigkeit der generierten Strecke
   - Stellen Sie sicher, dass alle Konnektoren korrekt positioniert und orientiert sind

### 6.4 Implementierung des Streckenassemblers

1. **Benutzeroberfläche**
   - Erstellen Sie eine UI mit einer Bibliothek verfügbarer Streckenelemente
   - Implementieren Sie eine 3D-Ansicht für die Strecke mit Navigationssteuerung
   - Fügen Sie Werkzeuge zum Platzieren, Verschieben und Rotieren von Elementen hinzu
   - Erstellen Sie Steuerelemente zum Speichern, Laden und Exportieren von Strecken

2. **Element-Platzierung**
   - Implementieren Sie Drag & Drop-Funktionalität für Streckenelemente
   - Ermöglichen Sie das Einrasten von Elementen an passenden Konnektoren
   - Implementieren Sie Prüfungen auf Kollisionen zwischen Elementen
   - Stellen Sie sicher, dass verbundene Elemente korrekt ausgerichtet sind

3. **Strecken-Verwaltung**
   - Implementieren Sie Funktionen zum Speichern und Laden von Strecken im localStorage
   - Erstellen Sie Export- und Import-Funktionen für Strecken als JSON-Dateien
   - Implementieren Sie eine Versionsverwaltung für Strecken
   - Ermöglichen Sie das Erstellen einer Vorschau oder Miniaturansicht der Strecke

### 6.5 Implementierung des Testmodus

1. **Fahrzeugphysik**
   - Implementieren Sie ein einfaches Fahrzeugmodell mit grundlegender Physik
   - Erstellen Sie Steuerungsfunktionen für Beschleunigung, Bremsen und Lenken
   - Implementieren Sie das benutzerdefinierte Gravitationssystem, das das Fahrzeug auf der Strecke hält
   - Stellen Sie eine flüssige und realistische Fahrzeugbewegung sicher

2. **Strecken-Interaktion**
   - Implementieren Sie die Erkennung von Start- und Ziellinie
   - Erstellen Sie ein Zeitmess-System für Rundenzeiten
   - Implementieren Sie die Kollisionserkennung zwischen Fahrzeug und Strecke
   - Stellen Sie sicher, dass das Fahrzeug der Strecke folgen kann

3. **Benutzeroberfläche**
   - Erstellen Sie ein Heads-up-Display mit Geschwindigkeit, Zeit und Position
   - Implementieren Sie eine Bestenliste für die aktuelle Strecke
   - Fügen Sie Steuerelemente zum Zurücksetzen und Neustart des Tests hinzu
   - Ermöglichen Sie die Rückkehr zum Editor mit einem Klick

### 6.6 Speicher- und Exportfunktionen

1. **localStorage-Management**
   - Implementieren Sie Funktionen zum strukturierten Speichern und Laden aus dem localStorage
   - Erstellen Sie ein Verwaltungssystem für die gespeicherten Strecken und Elemente
   - Implementieren Sie eine regelmäßige automatische Speicherung
   - Stellen Sie eine effiziente Speichernutzung sicher

2. **JSON-Export/Import für Strecken**
   - Implementieren Sie Funktionen zum Serialisieren und Deserialisieren von Strecken
   - Erstellen Sie einen Zip-Export für Strecken mit folgenden Komponenten:
     - Eine JSON-Datei für die Streckendaten
     - Ein Verzeichnis mit allen für die Strecke benötigten Streckenelementen als separate JSON-Dateien
   - Bieten Sie dem Nutzer zwei Export-Optionen:
     - "Nur Strecke": Export der Strecken-JSON-Datei allein
     - "Strecke mit Elementen": Export der Zip-Datei mit Strecke und allen benötigten Elementen
   - Implementieren Sie Import-Funktionen für beide Formate
   - Stellen Sie sicher, dass beim Import fehlende Streckenelemente erkannt und gemeldet werden
   - Stellen Sie sicher, dass Bestzeiten in den exportierten Dateien enthalten sind

3. **JSON-Export für Streckenelemente**
   - Implementieren Sie eine Exportfunktion für einzelne Streckenelemente als JSON-Dateien
   - Die exportierten Dateien müssen so formatiert sein, dass sie direkt in den Quellcode integriert werden können
   - Erstellen Sie ein Verzeichnis im Projekt, in dem die exportierten Streckenelemente gesammelt werden
   - Implementieren Sie eine Versionskontrolle für Streckenelemente

## 7. Abnahmekriterien
- Der Editor ermöglicht das Erstellen von Streckenelementen basierend auf dem Cubik-System (10x10x10)
- Die Streckenelemente können über Konnektoren verbunden werden
- Im Testmodus funktioniert die dynamische Gravitation zur Strecke hin
- Strecken können im localStorage gespeichert werden
- Strecken können als JSON-Dateien exportiert und importiert werden
- Die Anwendung läuft flüssig mit mindestens 60 FPS im Browser

## 8. Anhänge
### 8.1 Referenzen
- Babylon.js-Dokumentation: https://doc.babylonjs.com/
- TypeScript-Dokumentation: https://www.typescriptlang.org/docs/
- Vite-Dokumentation: https://vitejs.dev/guide/
- GitHub Actions-Dokumentation: https://docs.github.com/en/actions
- Trackmania (Referenzspiel): https://www.trackmania.com/

### 8.2 Glossar
- **Cubik**: Die Grundeinheit des Streckenrasters mit einer Größe von 10x10x10 Einheiten
- **Konnektor**: Verbindungspunkt an einer Cubik-Seite, an dem Streckenelemente verbunden werden können
- **Checkpoint**: Zwischenkonnektor, der hilft, den Verlauf einer Strecke zu definieren
- **WebGL**: Eine JavaScript-API zur Renderung von 3D-Grafiken in Webbrowsern
- **SPA (Single Page Application)**: Eine Webanwendung, die auf einer einzigen HTML-Seite läuft
- **Vite**: Ein modernes Build-Tool für Frontend-Projekte
- **Babylon.js**: Ein JavaScript-Framework für 3D-Grafiken im Web
- **Dynamische Gravitation**: Physikmodell, bei dem die Gravitationsrichtung variabel ist und sich an die Rennstrecke anpasst

## 9. DevOps und Deployment

### 9.1 GitHub Actions Workflow

Im Projekt muss ein automatisierter CI/CD-Prozess über GitHub Actions eingerichtet werden:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

### 9.2 Vite Konfiguration

Die Vite-Konfiguration muss angepasst werden, um folgende Anforderungen zu erfüllen:

1. Unterstützung für verschiedene Start-Modi (Editor/Test)
2. Automatische Browser-Aktualisierung bei Code-Änderungen
3. Korrekte Asset-Pfade für GitHub Pages

```javascript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    server: {
      open: true,
      watch: {
        usePolling: true,
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
    define: {
      __APP_MODE__: JSON.stringify(env.VITE_START_MODE || 'editor'),
    },
  };
});
```

### 9.3 Umgebungskonfiguration

Erstellen Sie folgende Umgebungsdateien für die verschiedenen Startmodi:

1. `.env.editor`:
```
VITE_START_MODE=editor
```

2. `.env.test`:
```
VITE_START_MODE=test
```

In der Anwendung wird der Startmodus folgendermaßen gelesen:

```typescript
// src/app/Config.ts
export const AppConfig = {
  startMode: __APP_MODE__,
  // weitere Konfigurationseinstellungen
};
```

## 10. Aufgaben für die KI

### 10.1 Projektstruktur

Entwerfen Sie eine optimale Ordnerstruktur für das Projekt unter Berücksichtigung der folgenden Anforderungen:

1. **Grundstruktur**
   - `src/`: Enthält den gesamten Quellcode der Anwendung
   - `dist/`: Enthält die kompilierte Version (wird vom Build-Prozess generiert)
   - `public/`: Enthält statische Assets, die direkt kopiert werden
   - `assets/`: Enthält Rohmaterial wie 3D-Modelle, Texturen und Audio
   - `docs/`: Enthält Markdown-Dokumentationen zum Projekt

2. **Streckenelemente**
   - Erstellen Sie einen dedizierten Ordner `src/data/track-elements/` für alle Streckenelementdefinitionen
   - Jedes Streckenelement soll als separate JSON-Datei in diesem Ordner gespeichert werden
   - Standardelemente sollen bereits beim Projektstart verfügbar sein
   - Die Struktur soll das einfache Hinzufügen neuer Elemente ermöglichen
   - Implementieren Sie einen automatischen Lademechanismus für alle Elemente in diesem Verzeichnis

3. **Dokumentation**
   - Im `docs/`-Ordner sollen alle projektbezogenen Markdown-Dokumente abgelegt werden
   - Erstellen Sie separate Dokumentationen für:
     - Benutzerhandbuch (`docs/user-guide.md`)
     - Entwicklerhandbuch (`docs/developer-guide.md`)
     - API-Dokumentation (`docs/api-docs.md`)
     - Streckenelement-Format (`docs/track-element-format.md`)

4. **Quellcode-Organisation**
   Die `src/`-Struktur soll logisch nach Funktionalitäten gegliedert sein:
   - `src/app/`: Hauptanwendungsklassen und Initialisierungscode
   - `src/editor/`: Alles rund um den Streckeneditor
   - `src/test/`: Implementierung des Testmodus
   - `src/engine/`: Babylon.js-Wrapper und Physik
   - `src/utils/`: Hilfsfunktionen und -klassen
   - `src/components/`: Wiederverwendbare UI-Komponenten
   - `src/data/`: Datenstrukturen und -modelle
   - `src/config/`: Konfigurationsdateien und -konstanten

5. **Build und Deployment**
   - `.github/workflows/`: GitHub Actions Konfiguration
   - `scripts/`: Build- und Entwicklungsskripte
   - `vite.config.ts`: Vite-Konfiguration
   - `.env.*`: Umgebungsvariablen für verschiedene Modi

## 11. Anhänge
### 11.1 Referenzen
- Babylon.js-Dokumentation: https://doc.babylonjs.com/
- TypeScript-Dokumentation: https://www.typescriptlang.org/docs/
- Vite-Dokumentation: https://vitejs.dev/guide/
- GitHub Actions-Dokumentation: https://docs.github.com/en/actions
- Trackmania (Referenzspiel): https://www.trackmania.com/

### 11.2 Glossar
- **Cubik**: Die Grundeinheit des Streckenrasters mit einer Größe von 10x10x10 Einheiten
- **Konnektor**: Verbindungspunkt an einer Cubik-Seite, an dem Streckenelemente verbunden werden können
- **Checkpoint**: Zwischenkonnektor, der hilft, den Verlauf einer Strecke zu definieren
- **WebGL**: Eine JavaScript-API zur Renderung von 3D-Grafiken in Webbrowsern
- **SPA (Single Page Application)**: Eine Webanwendung, die auf einer einzigen HTML-Seite läuft
- **Vite**: Ein modernes Build-Tool für Frontend-Projekte
- **Babylon.js**: Ein JavaScript-Framework für 3D-Grafiken im Web
- **Dynamische Gravitation**: Physikmodell, bei dem die Gravitationsrichtung variabel ist und sich an die Rennstrecke anpasst

# Hyperloop Racer

A 3D track editor and racing game built with TypeScript and Babylon.js.

## Features

- **Track Editor**: Design and build your own hyperloop racing tracks
- **Test Mode**: Test your tracks with a hyperloop racing pod
- **Track Elements**: Combine various track elements like straights, curves, loops, and ramps
- **Export/Import**: Share your tracks with others

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Running the Application

- **Development Mode (Editor)**:
  ```
  npm run dev
  ```

- **Editor Mode**:
  ```
  npm run start:editor
  ```

- **Test Mode**:
  ```
  npm run start:test
  ```

### Building for Production

```
npm run build
```

## Project Structure

- `src/app`: Main application classes
- `src/editor`: Track editor components
- `src/test`: Test mode components
- `src/engine`: Babylon.js wrapper and physics
- `src/utils`: Helper functions
- `src/components`: Reusable UI components
- `src/data`: Data structures and models
- `src/config`: Configuration files
- `assets`: 3D models, textures, etc.
- `docs`: Project documentation

## Technology Stack

- TypeScript
- Vite
- Babylon.js (3D engine)
- JSZip (for track import/export)

## License

This project is licensed under the MIT License.