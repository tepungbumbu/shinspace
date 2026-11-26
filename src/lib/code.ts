// Pure helpers for components written as code (the admin's code editor); usable on the server and in the browser.

// markup, style and script as one HTML string. A closing </style> or </script> inside the code would end the block early, so it is escaped.
export const composeCode = (html: string, css = '', js = '') =>
  html +
  (css.trim() ? `\n<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>` : '') +
  (js.trim() ? `\n<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>` : '')

// what a new component starts with
export const EXAMPLE_HTML = `<section class="bg-[#0e4f5c] py-16 text-center text-white">
  <div class="mx-auto max-w-3xl px-4">
    <p class="text-sm font-semibold uppercase tracking-widest text-orange-300">Limited offer</p>
    <h2 class="mt-3 text-4xl font-bold">Your headline goes here</h2>
    <p class="mt-4 text-lg text-white/80">A short supporting sentence that explains the offer.</p>
    <a href="#" class="mt-8 inline-block rounded-full bg-[#f26522] px-6 py-3 font-semibold text-white hover:bg-orange-500">Get started</a>
  </div>
</section>`
