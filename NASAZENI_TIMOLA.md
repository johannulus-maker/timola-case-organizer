# Jak dostat aplikaci na timola.cz

Aplikace je hotová jako samostatná webová aplikace. Veřejná doména `timola.cz` podle HTTP hlaviček běží na **Netlify**. Nejbezpečnější způsob je nepřepisovat současný web, ale přidat aplikaci jako samostatnou adresu:

> **Doporučená adresa: `app.timola.cz`**

## Co aplikace umí

Aplikace umožňuje přidávat vlastní záznamy, například řízení, dopisy nebo zásahy. U každého záznamu lze uvést typ, orgán nebo osobu, spisovou značku, datum doručení, další lhůtu, dopad a vlastní poznámku. Obsahuje přehled aktivních věcí, seznam lhůt, pracovní šablony a export/import zálohy.

Data této první verze se ukládají pouze do prohlížeče konkrétního zařízení. Na server se neposílají. To je vhodné pro soukromý osobní organizér, ale znamená to, že data nejsou automaticky synchronizovaná mezi telefonem a počítačem. K tomu by později byla potřeba přihlášená verze s databází.

## Varianta A: samostatné `app.timola.cz` (doporučeno)

1. V projektu spusťte produkční sestavení:

   ```bash
   pnpm install
   pnpm build
   ```

2. Výsledný obsah aplikace je ve složce `dist/public`.

3. V Netlify vytvořte nový site, například `timola-case-organizer`.

4. Jako **Publish directory** nastavte `dist/public`. Pokud Netlify používá automatický build, nastavte:

   ```text
   Build command: pnpm build
   Publish directory: dist/public
   ```

5. V nastavení nového Netlify site otevřete **Domain management → Add a domain → Add custom domain** a přidejte `app.timola.cz`.

6. Netlify zobrazí DNS záznam, který je potřeba přidat u registrátora domény `timola.cz`. Obvykle jde o CNAME pro `app` směřující na adresu Netlify.

7. Po propagaci DNS bude aplikace dostupná na `https://app.timola.cz`.

8. Na současný web timola.cz se přidá běžný odkaz nebo tlačítko **Otevřít osobní organizér** směřující na `https://app.timola.cz`.

## Varianta B: aplikace přímo jako `timola.cz/aplikace/`

Tato varianta je možná, ale vyžaduje úpravu současného Netlify projektu. Je potřeba:

- nastavit Vite `base` na `/aplikace/`,
- nahrát produkční výstup do stejného Netlify deploye,
- přidat přepisovací pravidlo, aby `timola.cz/aplikace/` načetlo aplikaci,
- vyzkoušet, že se současný web ani jeho routy nezmění.

Bez přístupu k repozitáři nebo Netlify administraci by se tato varianta neměla dělat naslepo. Proto je `app.timola.cz` bezpečnější a kdykoli vratná.

## Co bude potřeba ode mě / od vás

Pro skutečné nasazení stačí jedna z těchto možností:

- přístup do stejného GitHub/GitLab repozitáře, který Netlify pro timola.cz používá, nebo
- pozvání do Netlify projektu, nebo
- stažení složky `dist/public` a její nahrání do nového Netlify site.

Nikomu neposílejte heslo. Bezpečnější je pozvánka do Netlify týmu nebo jednorázový deploy přes vlastní účet.

## Důležité upozornění k soukromí

První verze ukládá záznamy do `localStorage` prohlížeče. Pokud uživatel smaže data prohlížeče nebo použije jiné zařízení, záznamy se bez ručně stažené zálohy neobnoví. V aplikaci proto jsou tlačítka **Stáhnout zálohu** a **Nahrát zálohu**. Před používáním v reálné věci je vhodné zálohu pravidelně stáhnout.

Tato aplikace a pracovní šablony nejsou právní radou. Konkrétní podání, lhůty a právní postup je potřeba ověřit podle místního práva a případně s kvalifikovaným právníkem.
