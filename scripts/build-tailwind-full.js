// Pre-build comprehensive Tailwind CSS for AI-generated preview pages.
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss-v3');

function generateContentHtml() {
  const colors = ['gray','red','blue','green','yellow','purple','indigo','pink','white','black','emerald','amber','slate','zinc','violet','orange','teal','cyan','sky','rose','fuchsia','lime'];
  const shades = ['50','100','200','300','400','500','600','700','800','900'];
  const sizes = ['xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl'];
  const spacing = ['0','0.5','1','1.5','2','2.5','3','3.5','4','5','6','7','8','9','10','11','12','14','16','20','24','28','32','36','40','44','48','52','56','60','64','72','80','96'];
  const radii = ['none','sm','','md','lg','xl','2xl','3xl','full'];
  const shadows = ['sm','','md','lg','xl','2xl','inner','none'];
  const weights = ['thin','extralight','light','normal','medium','semibold','bold','extrabold','black'];
  const maxWs = ['xs','sm','md','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','full','screen','none'];

  let h = '<body>';

  // ── Named colors (white, black, transparent, current) ──
  for (const cls of ['text-white','text-black','text-transparent','text-current','bg-white','bg-black','bg-transparent','bg-current','border-white','border-black','border-transparent']) {
    h += `<i class="${cls}"></i>`;
  }

  // ── Text colors with shades ──
  for (const c of colors) {
    if (c === 'white' || c === 'black') continue; // handled above
    for (const s of shades) h += `<i class="text-${c}-${s}"></i>`;
  }

  // ── Background colors with shades ──
  for (const c of colors.slice(0,16)) {
    if (c === 'white' || c === 'black') continue;
    for (const s of shades.slice(0,9)) h += `<i class="bg-${c}-${s}"></i>`;
  }

  // ── Opacity modifiers (e.g. bg-white/80, text-white/70) ──
  for (const pfx of ['bg-','text-','border-']) {
    for (const c of ['white','black','gray-900','gray-500','gray-100','blue-500','blue-600','indigo-600','purple-600','emerald-500']) {
      for (const op of ['5','10','20','30','40','50','60','70','75','80','90','95']) {
        h += `<i class="${pfx}${c}/${op}"></i>`;
      }
    }
  }

  // ── Font sizes ──
  for (const s of sizes) h += `<i class="text-${s}"></i>`;
  for (const bp of ['sm','md','lg']) for (const s of sizes) h += `<i class="${bp}:text-${s}"></i>`;

  // ── Font weights ──
  for (const w of weights) h += `<i class="font-${w}"></i>`;

  // ── Spacing (margin, padding, gap) ──
  for (const s of spacing) {
    h += `<i class="m-${s} mx-${s} my-${s} mt-${s} mr-${s} mb-${s} ml-${s} p-${s} px-${s} py-${s} pt-${s} pr-${s} pb-${s} pl-${s} gap-${s} gap-x-${s} gap-y-${s} space-x-${s} space-y-${s}"></i>`;
    for (const bp of ['sm','md','lg']) h += `<i class="${bp}:p-${s} ${bp}:px-${s} ${bp}:py-${s} ${bp}:mt-${s} ${bp}:mb-${s}"></i>`;
  }

  // ── Border radius ──
  for (const r of radii) h += `<i class="rounded${r ? '-'+r : ''}"></i>`;

  // ── Shadows ──
  for (const s of shadows) h += `<i class="shadow${s ? '-'+s : ''}"></i>`;

  // ── Max widths ──
  for (const m of maxWs) h += `<i class="max-w-${m}"></i>`;

  // ── Layout ──
  h += `<i class="container mx-auto relative absolute fixed sticky inset-0 top-0 right-0 bottom-0 left-0 z-0 z-10 z-20 z-30 z-40 z-50 overflow-hidden overflow-auto overflow-x-hidden overflow-y-auto overflow-x-auto overflow-y-hidden block inline-block inline flex inline-flex grid hidden"></i>`;
  h += `<i class="flex-row flex-col flex-row-reverse flex-col-reverse items-start items-center items-end items-stretch items-baseline justify-start justify-center justify-end justify-between justify-around justify-evenly flex-wrap flex-nowrap flex-1 flex-auto flex-initial flex-none"></i>`;
  h += `<i class="grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6"></i>`;
  h += `<i class="sm:grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 md:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 lg:grid-cols-4 lg:grid-cols-6"></i>`;

  // ── Gradients ──
  for (const dir of ['to-r','to-b','to-br','to-t','to-l','to-tr','to-tl','to-bl']) {
    for (const c1 of ['white','gray-50','blue-50','indigo-50','purple-50','blue-500','blue-600','indigo-500','indigo-600','purple-600','purple-700','emerald-500','pink-500','orange-500','teal-500','cyan-500','violet-600','rose-500','sky-500']) {
      for (const c2 of ['purple-600','purple-700','blue-600','indigo-600','pink-500','violet-600','emerald-600','orange-500','teal-600','rose-600','sky-600','white','purple-50','blue-50','gray-50','indigo-50','gray-900','slate-900']) {
        if (c1.split('-')[0] !== c2.split('-')[0] || c1.split('-')[1] !== c2.split('-')[1]) {
          h += `<i class="bg-gradient-${dir} from-${c1} to-${c2}"></i>`;
        }
      }
    }
    // via- colors for gradient
    for (const v of ['transparent','purple-500','blue-400','indigo-400','pink-400','violet-500']) {
      h += `<i class="via-${v}"></i>`;
    }
  }

  // ── Borders ──
  for (const c of colors.slice(0,10)) {
    if (c === 'white' || c === 'black') continue;
    for (const s of ['100','200','300','400','500','600','700']) h += `<i class="border border-${c}-${s}"></i>`;
  }
  h += `<i class="border-t border-b border-l border-r border-0 border-2 border-4 border-8 border-solid border-dashed border-dotted border-none border-transparent border-white border-black"></i>`;
  h += `<i class="divide-y divide-x divide-gray-100 divide-gray-200 divide-gray-300"></i>`;

  // ── Effects ──
  for (const op of ['0','5','10','20','25','30','40','50','60','70','75','80','90','95','100']) {
    h += `<i class="opacity-${op}"></i>`;
  }
  h += `<i class="transition transition-all transition-colors transition-opacity transition-shadow transition-transform duration-75 duration-100 duration-150 duration-200 duration-300 duration-500 duration-700 duration-1000"></i>`;
  h += `<i class="ease-linear ease-in ease-out ease-in-out"></i>`;
  h += `<i class="scale-75 scale-90 scale-95 scale-100 scale-105 scale-110 scale-125 scale-150"></i>`;
  h += `<i class="hover:scale-105 hover:scale-110 hover:scale-95"></i>`;
  h += `<i class="backdrop-blur-sm backdrop-blur backdrop-blur-md backdrop-blur-lg backdrop-blur-xl backdrop-blur-2xl backdrop-blur-3xl backdrop-filter backdrop-filter-none"></i>`;

  // ── Typography ──
  h += `<i class="leading-none leading-tight leading-snug leading-normal leading-relaxed leading-loose leading-3 leading-4 leading-5 leading-6 leading-7 leading-8 leading-9 leading-10"></i>`;
  h += `<i class="tracking-tighter tracking-tight tracking-normal tracking-wide tracking-wider tracking-widest"></i>`;
  h += `<i class="whitespace-nowrap whitespace-pre whitespace-pre-line whitespace-pre-wrap text-left text-center text-right text-justify"></i>`;
  h += `<i class="uppercase lowercase capitalize italic not-italic underline line-through no-underline decoration-none"></i>`;
  h += `<i class="truncate antialiased subpixel-antialiased"></i>`;
  h += `<i class="list-inside list-outside list-disc list-decimal list-none"></i>`;
  h += `<i class="line-clamp-1 line-clamp-2 line-clamp-3 line-clamp-none"></i>`;

  // ── Width / Height ──
  h += `<i class="w-full w-auto w-1/2 w-1/3 w-2/3 w-1/4 w-3/4 w-1/5 w-2/5 w-3/5 w-4/5 w-screen w-min w-max w-0 w-px"></i>`;
  for (const s of ['1','2','3','4','5','6','8','10','12','16','20','24','32','40','48','56','64']) {
    h += `<i class="w-${s} h-${s}"></i>`;
  }
  h += `<i class="h-full h-auto h-1/2 h-screen h-min h-max h-0 h-px"></i>`;
  h += `<i class="min-h-screen min-h-0 min-h-full max-h-screen max-h-full max-h-0 min-w-0 min-w-full max-w-full max-w-screen max-w-none"></i>`;

  // ── Pseudo-classes ──
  h += `<i class="hover:text-white hover:text-black hover:text-gray-900 hover:text-gray-600 hover:text-blue-600 hover:text-indigo-600"></i>`;
  h += `<i class="hover:bg-gray-50 hover:bg-gray-100 hover:bg-gray-200 hover:bg-blue-50 hover:bg-indigo-50 hover:bg-purple-50 hover:bg-white"></i>`;
  h += `<i class="hover:shadow-md hover:shadow-lg hover:shadow-xl hover:shadow-2xl"></i>`;
  h += `<i class="hover:opacity-90 hover:opacity-100 hover:opacity-80"></i>`;
  h += `<i class="hover:underline hover:no-underline"></i>`;
  h += `<i class="hover:border-gray-300 hover:border-gray-400 hover:border-blue-500"></i>`;
  h += `<i class="hover:bg-blue-600 hover:bg-blue-700 hover:bg-indigo-600 hover:bg-indigo-700 hover:bg-purple-600 hover:bg-purple-700 hover:bg-emerald-600 hover:bg-emerald-700 hover:bg-gray-700 hover:bg-gray-800 hover:bg-gray-900"></i>`;
  h += `<i class="focus:outline-none focus:ring-2 focus:ring-4 focus:ring-0 focus:ring-blue-500 focus:ring-indigo-500 focus:ring-purple-500 focus:ring-offset-2 focus:border-blue-500 focus:border-transparent focus:ring-white focus:ring-opacity-50"></i>`;
  h += `<i class="disabled:opacity-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"></i>`;
  h += `<i class="group-hover:opacity-100 group-hover:visible group-hover:block group-hover:flex"></i>`;

  // ── Cursor ──
  h += `<i class="cursor-pointer cursor-not-allowed cursor-default cursor-auto cursor-text cursor-wait cursor-progress cursor-move cursor-grab cursor-zoom-in"></i>`;

  // ── Display helpers ──
  h += `<i class="sr-only not-sr-only visible invisible"></i>`;

  // ── Object fit / position ──
  h += `<i class="object-contain object-cover object-fill object-none object-scale-down object-center object-top object-bottom object-left object-right"></i>`;

  // ── Order ──
  h += `<i class="order-first order-last order-none order-1 order-2 order-3"></i>`;

  // ── Columns ──
  h += `<i class="columns-1 columns-2 columns-3"></i>`;
  h += `<i class="break-inside-avoid"></i>`;

  // ── Aspect ratio ──
  h += `<i class="aspect-auto aspect-square aspect-video aspect-\[4\/3\] aspect-\[16\/9\]"></i>`;

  // ── SVG fill / stroke ──
  h += `<i class="fill-current stroke-current stroke-0 stroke-1 stroke-2"></i>`;

  // ── Background clip ──
  h += `<i class="bg-clip-border bg-clip-padding bg-clip-content bg-clip-text"></i>`;

  // ── Background attachment ──
  h += `<i class="bg-fixed bg-local bg-scroll"></i>`;

  // ── Background repeat ──
  h += `<i class="bg-repeat bg-no-repeat bg-repeat-x bg-repeat-y bg-repeat-round bg-repeat-space"></i>`;

  // ── Background size ──
  h += `<i class="bg-auto bg-cover bg-contain"></i>`;

  // ── Background position ──
  h += `<i class="bg-bottom bg-center bg-left bg-left-bottom bg-left-top bg-right bg-right-bottom bg-right-top bg-top"></i>`;

  // ── Mix blend mode ──
  h += `<i class="mix-blend-normal mix-blend-multiply mix-blend-screen mix-blend-overlay"></i>`;

  // ── Ring (focus ring) ──
  h += `<i class="ring-1 ring-2 ring-4 ring-0 ring-inset ring-white ring-black ring-blue-500 ring-indigo-500 ring-offset-1 ring-offset-2 ring-offset-white"></i>`;

  // ── Select ──
  h += `<i class="select-none select-text select-all select-auto"></i>`;

  // ── Pointer events ──
  h += `<i class="pointer-events-none pointer-events-auto"></i>`;

  // ── Resize ──
  h += `<i class="resize-none resize resize-x resize-y"></i>`;

  // ── Touch action ──
  h += `<i class="touch-auto touch-none touch-pan-x touch-pan-y touch-manipulation"></i>`;

  // ── User select ──
  h += `<i class="select-none select-text select-all select-auto"></i>`;

  // ── Negative margin ──
  for (const s of ['1','2','3','4','5','6','8','10','12','16','20','24']) {
    h += `<i class="-m-${s} -mx-${s} -my-${s} -mt-${s} -mr-${s} -mb-${s} -ml-${s}"></i>`;
  }

  h += '</body>';
  return h;
}

async function main() {
  console.log('Building Tailwind CSS...');
  const contentHtml = generateContentHtml();
  console.log(`Content: ${contentHtml.length} chars, ${(contentHtml.match(/class="/g) || []).length} class attrs`);

  try {
    const result = await postcss([
      tailwindcss({ content: [{ raw: contentHtml, extension: 'html' }] }),
    ]).process('@tailwind base;@tailwind components;@tailwind utilities;', { from: undefined });

    const outputPath = path.join(__dirname, '..', 'public', 'tailwind', 'prebuilt.css');
    fs.writeFileSync(outputPath, result.css);
    console.log(`CSS generated: ${(result.css.length / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.error('Build failed:', e.message);
    process.exit(1);
  }
}

main();
