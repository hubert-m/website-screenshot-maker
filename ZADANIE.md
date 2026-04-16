> Jesteś ekspertem programowania full-stack. Twoim zadaniem jest napisanie kompletnej aplikacji do generowania zrzutów ekranu stron WWW od zera, w jednym repozytorium.
> 
> **Stos technologiczny:**
> * Framework: Next.js (App Router, wersja 14+)
> * Język: TypeScript
> * Style: Tailwind CSS
> * Backend (automatyzacja): `puppeteer`
> 
> **Architektura:**
> Projekt to monorepo w Next.js. Zawiera zarówno interfejs użytkownika (Frontend), jak i Route Handlers pełniące rolę API (Backend). 
> 
> **1. Wymagania Frontendu (UI - `app/page.tsx`):**
> * Zbuduj prosty, estetyczny i nowoczesny formularz wyśrodkowany na ekranie (użyj Tailwind CSS).
> * **Pola formularza:**
>    - Adres URL strony (input typu text/url, walidacja poprawności adresu, np. czy zaczyna się od http/https).
>    - Szerokość okna w pikselach (input typu number, domyślnie: 1920).
>    - Wysokość okna w pikselach (input typu number, domyślnie: 1080).
>    - Checkbox: "Zrzut całej strony (Full Page)" - jeśli użytkownik go zaznaczy, pole "Wysokość okna" powinno zostać zablokowane (disabled) lub ukryte.
>    - Format pliku: Element `<select>` (Opcje: JPG, PNG).
> * **Przycisk submit:** "Generuj i pobierz".
> * **Zarządzanie stanem:** >    - Gdy żądanie jest wysyłane do API, przycisk ma być wyłączony (disabled) i zmieniać tekst na "Generowanie... (to może potrwać kilka sekund)".
>    - Obsłuż i wyświetl błędy (np. w postaci czerwonego komunikatu pod formularzem), jeśli API zwróci błąd.
> * **Pobieranie pliku:** Po otrzymaniu udanej odpowiedzi (obrazu) z API, frontend ma odczytać odpowiedź jako `Blob`, stworzyć tymczasowy obiekt URL (`URL.createObjectURL`) i symulować kliknięcie w niewidoczny link `<a>`, co automatycznie rozpocznie pobieranie pliku na dysk użytkownika.
> 
> **2. Wymagania Backendu (API - `app/api/screenshot/route.ts`):**
> * Odbiera żądanie POST z danymi w formacie JSON (url, width, height, fullPage, format).
> * Waliduje otrzymane dane (sprawdza czy URL jest obecny).
> * **Logika Puppeteer:**
>    - **Inicjalizacja przeglądarki (zależna od środowiska):**
>      - **Lokalnie (`NODE_ENV === 'development'`):** Uruchamia nową instancję: `puppeteer.launch({ headless: true })`.
>      - **Produkcja:** Łączy się z istniejącą instancją Chrome. Logika:
>        1. Pobierz dane JSON z `http://127.0.0.1:9222/json/version`.
>        2. Znajdź w odpowiedzi pole `webSocketDebuggerUrl`.
>        3. Połącz się używając: `puppeteer.connect({ browserWSEndpoint: wsUrl, defaultViewport: { width: 1920, height: 1080 } })`.
>    - Otwiera nową kartę: `browser.newPage()`.
>    - Ustawia rozmiar okna na podstawie przesłanej szerokości i wysokości: `page.setViewport({ width, height })`.
>    - Przechodzi pod wskazany URL: `page.goto(url, { waitUntil: 'networkidle0' })` (żeby poczekać na załadowanie zasobów strony).
>    - Generuje zrzut ekranu: `page.screenshot(...)`. Jeśli przekazano flagę `fullPage: true`, ustaw odpowiednią opcję w funkcji screenshot, zignoruj wtedy limit wysokości. Zwróć uwagę na wybrany przez usera format pliku.
>    - **Kluczowe:** Bezpiecznie zamyka sesję po udanym zrzucie: `await browser.disconnect()` (dla produkcji) lub `await browser.close()` (dla lokalnego). Zamknij zasoby również w bloku `catch`, jeśli wystąpi błąd podczas renderowania strony!
> * **Zwracanie danych:** Zwraca wygenerowany obraz jako bufor bezpośrednio w obiekcie `NextResponse`. Ustaw odpowiednie nagłówki: `Content-Type` (np. `image/png`) oraz `Content-Disposition: attachment; filename="screenshot.[format]"`, aby wymusić pobieranie.
> 
> Wygeneruj strukturę plików oraz pełny kod dla głównych elementów: strony głównej (`page.tsx`) oraz endpointu API (`route.ts`). Dodaj też instrukcję z komendami do instalacji potrzebnych paczek (szczególnie `puppeteer`).