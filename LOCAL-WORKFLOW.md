# YPP: local marka hore, hosting kadib

## Hadda: dhammee oo tijaabi local-ka

Terminal-ka project-ka ku qor:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-Local.ps1
```

Launcher-ku wuxuu isticmaalaa Node 22+ haddii uu jiro. Haddii uusan jirin, wuxuu Node 22 portable ka soo dejinayaa bogga rasmiga ah `nodejs.org`, wuxuu hubinayaa SHA-256, kadib wuxuu ku hayaa `.tools/` oo Git ka qarsoon. Ma beddelo PATH ama execution policy-ga joogtada ah. Download-ka koowaad wuxuu u baahan yahay internet; isticmaalka local-ka kadib uma baahna GitHub, Netlify ama Auth0.

Isha runtime-ka: [Node.js official downloads](https://nodejs.org/en/download). Haddii firewall ama internet-ku xannibo download-ka, rakib Node 22+ adigoo adeegsanaya bogga rasmiga ah, kadib launcher-ka mar kale fur.

Dooro email iyo password terminal-ka. Fur **http://127.0.0.1:8888/** si aad design-ka u aragto, ama **http://127.0.0.1:8888/admin/login.html** si aad u gasho dashboard-ka. `Save locally` wuxuu beddelaa xogta project-kaaga. `Preview` wuxuu ku tusaa isbeddellada aan la kaydin. Ctrl+C ayaa joojiya server-ka.

Tijaabi qayb kasta ka hor hosting:

1. Home: hero title/description, image, buttons iyo facts.
2. About: mission, vision, values, director iyo sawirka.
3. Programs: ku dar, wax ka beddel, kala-habee, kana saar kaar.
4. Events: date/location, published/unpublished iyo sawir.
5. Gallery: sawirro badan, captions, groups iyo kala-habayn.
6. Team: magac, position, photo, kala-habayn iyo remove.
7. Contact: email, phone iyo location; hubi email-ka form-ku u furayo.
8. Settings: logo, title, SEO description, footer iyo navigation.
9. Preview, save, refresh website, logout iyo login mar kale.

## Koodhka halka uu yaal

| Fayl | Shaqadiisa |
| --- | --- |
| `index.html` | Naqshadda iyo qaybaha bogga dadweynaha |
| `assets/css/site.css` | Midabada iyo layout-ka website-ka |
| `assets/js/content.js`, `cms-render.js` | Ku muujiya JSON xogta iyadoo aan qoraal loo rogin HTML |
| `content/site.json` | Qoraalka, settings-ka iyo collections-ka la kaydiyey |
| `admin/js/dashboard.js`, `collection-editor.js` | Forms, sawirro, preview iyo maaraynta kaararka |
| `admin/js/login.js` | Login local ama Auth0, iyadoo ku xiran server-ka la isticmaalayo |
| `scripts/local-server.mjs` | Local login, sessions, CSRF, file saves iyo uploads |
| `netlify/functions/` | Authentication iyo GitHub publishing ee hosting-ka dambe |

Faallooyinka amniga ee local server-ku waxay sharxayaan password hashing, session IDs, CSRF, Host checks, file allowlist, backup iyo save conflicts. Password dhab ah ama GitHub token laguma geliyo browser code. Faallo kaliya amni ma xaqiijiso; server-ku wuxuu fulinayaa hubinnadaas.

## Tijaabo otomaatig ah

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-Local.ps1 -Test
```

Tijaabadu waxay isticmaashaa project copy ku meel gaar ah. Waxay hubisaa login, anonymous-write rejection, CSRF/Origin, local save, backup, conflict, image upload iyo logout; ma beddesho xogtaada dhabta ah.

## Kadib: GitHub iyo Netlify

Marka design-ka iyo local CMS-ka aad ku qanacdo, isticmaal `README.md` si loo dejiyo Auth0, GitHub fine-grained token iyo Netlify Functions environment variables. Isla website-ka, dashboard-ka iyo JSON ayaa la isticmaalayaa; backend-ka Netlify ayaa qaadaya xaqiijinta iyo publishing-ka. `.tools/`, `.local-backups/`, `.env` iyo local credentials lama publish-gareeyo.

Wax online ah si otomaatig ah looma abuuro ama loo publish-gareeyo markaad local launcher-ka isticmaalayso.


Audit iyo xaaladda tijaabooyinka: [AUDIT-REPORT.md](AUDIT-REPORT.md). Bootstrap, icons iyo DM Sans local ayay hadda ku jiraan; CDN uma baahna. Launcher-ka 8888 ayuu sii isticmaalaa, halka `npm run dev` uu yahay port 3000.
