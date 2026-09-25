// Theme initializer — runs synchronously before first paint to prevent FOUC.
// Served as a static asset so no JSX <script> tag is needed in layout.tsx.
try {
  var s = localStorage.getItem('littlelyst-theme');
  var r = document.documentElement;
  if (s === 'light') {
    r.classList.remove('dark');
    r.classList.add('light');
    r.setAttribute('data-theme', 'light');
    r.style.colorScheme = 'light';
  } else {
    r.classList.add('dark');
    r.classList.remove('light');
    r.setAttribute('data-theme', 'dark');
    r.style.colorScheme = 'dark';
  }
} catch (e) {}
