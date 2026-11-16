/* global document, location */
/* Runs before first paint. The page is a plain resume by default; unless the URL asks for
   the resume (#resume…), switch to game mode. Kept as a file so the CSP needs no 'unsafe-inline'. */
if (!/^#resume/.test(location.hash)) document.documentElement.classList.add('play');
