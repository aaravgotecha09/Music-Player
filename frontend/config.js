/* Where the Echo backend lives.

   Deployed (frontend on Vercel, backend on Render):
     set this to your Render URL, with no trailing slash, e.g.
       window.ECHO_API_BASE = 'https://echo-api.onrender.com';

   Local run (the C server also serves this folder):
     leave it empty so requests go to the same address as this page. */
window.ECHO_API_BASE = '';
