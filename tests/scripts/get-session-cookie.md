# Come Ottenere il Cookie di Sessione

## Metodo 1: Chrome DevTools

1. Apri Chrome e vai su http://localhost:3000
2. Fai login con:
   - Email: `admin@mantaaero.com`
   - Password: `password123`
3. Apri DevTools (F12)
4. Vai nella tab **Application** (o Storage)
5. Nel menu laterale, espandi **Cookies** > **http://localhost:3000**
6. Cerca il cookie `authjs.session-token`
7. Copia il valore nella colonna **Value**

## Metodo 2: Console JavaScript

1. Dopo il login, apri la console (F12 > Console)
2. Esegui:
```javascript
document.cookie.split(';').find(c => c.trim().startsWith('authjs.session-token'))
```
3. Copia solo il valore dopo `authjs.session-token=`

## Metodo 3: Network Tab

1. Dopo il login, vai in DevTools > Network
2. Ricarica la pagina (F5)
3. Clicca su qualsiasi richiesta
4. Guarda gli Headers > Request Headers > Cookie
5. Trova `authjs.session-token` e copia il valore

## Test Rapido

Una volta ottenuto il cookie, puoi testare con:

```bash
curl http://localhost:3000/api/parts \
  -H "Cookie: authjs.session-token=IL_TUO_COOKIE_QUI"
```

Se ricevi dati JSON, il cookie funziona!