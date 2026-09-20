# Pixel Quest

Pixel Quest este un joc platformer retro in care explorezi niveluri generate procedural, colectezi monede, elimini inamici si ajungi la usa EXIT. Jocul include platforme mobile, power-up-uri, checkpoint-uri, particule si efecte sonore.

## Tehnologii utilizate

- HTML5 pentru structura paginii
- CSS3 pentru interfata dark retro si HUD
- JavaScript pentru logica jocului
- Canvas 2D pentru randare
- Web Audio API pentru efecte sonore si muzica
- Jest pentru teste unitare si de integrare

## Instalare si rulare

1. Cloneaza sau descarca proiectul.
2. Intra in directorul proiectului.
3. Ruleaza pagina `index.html` intr-un browser modern.
4. Pentru un server local, foloseste orice server static, de exemplu:

```bash
python3 -m http.server 8000
```

Deschide apoi `http://localhost:8000`.

Pentru teste Jest:

```bash
npm install
npm test
```

## Controale

- `A` / `Sageata stanga`: deplasare la stanga
- `D` / `Sageata dreapta`: deplasare la dreapta
- `W`, `Sageata sus` sau `Space`: saritura
- Click pe canvas: saritura pe dispozitive mobile
- `F5`: reincepe dupa Game Over

## Functionalitati principale

- Niveluri generate procedural cu platforme statice si mobile
- Monede cu animatie, magnet si explozii de particule
- Inamici care patruleaza si pot fi eliminati prin saritura
- Power-up-uri pentru double jump, invincibilitate si magnet
- Aura aurie animata pentru invincibilitate
- Checkpoint-uri la fiecare trei niveluri, salvate in `localStorage`
- Vieti, scor, nivel curent si ecran Game Over
- Particule pentru salt, aterizare, colectare si eliminarea inamicilor
- Efecte sonore si muzica de fundal prin Web Audio API
- HUD retro cu actualizare in timp real

## Contribuie

1. Creeaza un fork al proiectului.
2. Creeaza un branch pentru modificarea ta.
3. Adauga teste pentru comportamentul nou.
4. Ruleaza `npm test`.
5. Deschide un Pull Request cu o descriere clara.

Pastreaza modificarile mici, accesibile si compatibile cu rularea statica in browser.

## Licenta

Proiectul este distribuit sub licenta MIT. Vezi fisierul `LICENSE` daca este adaugat in distributie.