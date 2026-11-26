// The Tailwind utility reference (layout, flex/grid, typography, ... SVG) as data the Inspector renders.
// Every value is a plain class name; the canvas compiles whatever is used with the in-browser Tailwind build.
export type Prop = { id: string; label: string; k: 'opt' | 'color' | 'free'; o?: string[]; pre?: string; hint?: string }
export type Group = { title: string; props: Prop[] }

const w = (s: string) => s.split(' ')
const opt = (id: string, label: string, o: string[]): Prop => ({ id, label, k: 'opt', o })
const kw = (id: string, label: string, s: string) => opt(id, label, w(s)) // keyword classes, used as written
const pf = (id: string, label: string, pre: string, vals: string[]) => opt(id, label, vals.map((v) => `${pre}-${v}`))
const neg = (pre: string, vals: string[]) => vals.filter((v) => v !== '0').map((v) => `-${pre}-${v}`)
const col = (id: string, label: string, pre: string): Prop => ({ id, label, k: 'color', pre })
const free = (id: string, label: string, hint: string): Prop => ({ id, label, k: 'free', hint })

export const PALETTES = w('slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose')
export const SPECIAL = w('black white transparent current inherit')
export const SHADES = w('50 100 200 300 400 500 600 700 800 900 950')

const SP = w('0 px 0.5 1 1.5 2 2.5 3 3.5 4 5 6 7 8 9 10 11 12 14 16 20 24 28 32 36 40 44 48 52 56 60 64 72 80 96')
const FR = w('1/2 1/3 2/3 1/4 3/4 1/5 2/5 3/5 4/5 1/6 5/6 full')
const CS = w('3xs 2xs xs sm md lg xl 2xl 3xl 4xl 5xl 6xl 7xl')
const N12 = w('1 2 3 4 5 6 7 8 9 10 11 12')
const POS = w('top-left top top-right left center right bottom-left bottom bottom-right')
const BLEND = w('normal multiply screen overlay darken lighten color-dodge color-burn hard-light soft-light difference exclusion hue saturation color luminosity')
const RAD = w('none xs sm md lg xl 2xl 3xl full')
const PCT = w('0 50 75 90 95 100 105 110 125 150 200')
const T = 'transition'

const radius = (id: string, label: string, pre: string) => pf(id, label, pre, RAD)
const space = (id: string, label: string, pre: string, extra: string[] = []) => pf(id, label, pre, [...SP, ...extra])

export const GROUPS: Group[] = [
  {
    title: 'Layout',
    props: [
      kw('aspect', 'Aspect ratio', 'aspect-auto aspect-square aspect-video aspect-3/2 aspect-4/3 aspect-4/5 aspect-5/4 aspect-3/4 aspect-2/3 aspect-9/16 aspect-16/9 aspect-16/10 aspect-21/9'),
      opt('columns', 'Columns', [...N12.map((n) => `columns-${n}`), ...CS.map((n) => `columns-${n}`)]),
      kw('break-after', 'Break after', 'break-after-auto break-after-avoid break-after-all break-after-avoid-page break-after-page break-after-left break-after-right break-after-column'),
      kw('break-before', 'Break before', 'break-before-auto break-before-avoid break-before-all break-before-avoid-page break-before-page break-before-left break-before-right break-before-column'),
      kw('break-inside', 'Break inside', 'break-inside-auto break-inside-avoid break-inside-avoid-page break-inside-avoid-column'),
      kw('box-decoration', 'Box decoration break', 'box-decoration-clone box-decoration-slice'),
      kw('box-sizing', 'Box sizing', 'box-border box-content'),
      kw('display', 'Display', 'block inline-block inline flow-root flex inline-flex grid inline-grid contents list-item hidden table inline-table table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row-group table-row'),
      kw('float', 'Float', 'float-start float-end float-right float-left float-none'),
      kw('clear', 'Clear', 'clear-start clear-end clear-left clear-right clear-both clear-none'),
      kw('isolation', 'Isolation', 'isolate isolation-auto'),
      kw('object-fit', 'Object fit', 'object-contain object-cover object-fill object-none object-scale-down'),
      pf('object-position', 'Object position', 'object', POS),
      kw('overflow', 'Overflow', 'overflow-auto overflow-hidden overflow-clip overflow-visible overflow-scroll'),
      kw('overflow-x', 'Overflow X', 'overflow-x-auto overflow-x-hidden overflow-x-clip overflow-x-visible overflow-x-scroll'),
      kw('overflow-y', 'Overflow Y', 'overflow-y-auto overflow-y-hidden overflow-y-clip overflow-y-visible overflow-y-scroll'),
      kw('overscroll', 'Overscroll behavior', 'overscroll-auto overscroll-contain overscroll-none overscroll-x-auto overscroll-x-contain overscroll-x-none overscroll-y-auto overscroll-y-contain overscroll-y-none'),
      kw('position', 'Position', 'static fixed absolute relative sticky'),
      opt('inset', 'Inset (all sides)', [...SP, ...FR, 'auto'].map((v) => `inset-${v}`).concat(neg('inset', SP))),
      opt('top', 'Top', [...SP, ...FR, 'auto'].map((v) => `top-${v}`).concat(neg('top', SP))),
      opt('right', 'Right', [...SP, ...FR, 'auto'].map((v) => `right-${v}`).concat(neg('right', SP))),
      opt('bottom', 'Bottom', [...SP, ...FR, 'auto'].map((v) => `bottom-${v}`).concat(neg('bottom', SP))),
      opt('left', 'Left', [...SP, ...FR, 'auto'].map((v) => `left-${v}`).concat(neg('left', SP))),
      kw('visibility', 'Visibility', 'visible invisible collapse'),
      kw('z', 'Z-index', 'z-0 z-10 z-20 z-30 z-40 z-50 z-auto'),
    ],
  },
  {
    title: 'Flexbox & Grid',
    props: [
      opt('basis', 'Flex basis', [...SP, ...FR, ...CS, 'auto'].map((v) => `basis-${v}`)),
      kw('flex-direction', 'Flex direction', 'flex-row flex-row-reverse flex-col flex-col-reverse'),
      kw('flex-wrap', 'Flex wrap', 'flex-wrap flex-nowrap flex-wrap-reverse'),
      kw('flex', 'Flex', 'flex-1 flex-auto flex-initial flex-none'),
      kw('grow', 'Flex grow', 'grow grow-0'),
      kw('shrink', 'Flex shrink', 'shrink shrink-0'),
      opt('order', 'Order', [...N12.map((n) => `order-${n}`), 'order-first', 'order-last', 'order-none']),
      opt('grid-cols', 'Grid columns', [...N12.map((n) => `grid-cols-${n}`), 'grid-cols-none', 'grid-cols-subgrid']),
      opt('col-span', 'Column span', [...N12.map((n) => `col-span-${n}`), 'col-span-full', 'col-auto']),
      opt('col-start', 'Column start', [...N12.map((n) => `col-start-${n}`), 'col-start-13', 'col-start-auto']),
      opt('col-end', 'Column end', [...N12.map((n) => `col-end-${n}`), 'col-end-13', 'col-end-auto']),
      opt('grid-rows', 'Grid rows', [...N12.map((n) => `grid-rows-${n}`), 'grid-rows-none', 'grid-rows-subgrid']),
      opt('row-span', 'Row span', [...N12.map((n) => `row-span-${n}`), 'row-span-full', 'row-auto']),
      opt('row-start', 'Row start', [...N12.map((n) => `row-start-${n}`), 'row-start-auto']),
      opt('row-end', 'Row end', [...N12.map((n) => `row-end-${n}`), 'row-end-auto']),
      kw('grid-flow', 'Grid auto flow', 'grid-flow-row grid-flow-col grid-flow-dense grid-flow-row-dense grid-flow-col-dense'),
      kw('auto-cols', 'Grid auto columns', 'auto-cols-auto auto-cols-min auto-cols-max auto-cols-fr'),
      kw('auto-rows', 'Grid auto rows', 'auto-rows-auto auto-rows-min auto-rows-max auto-rows-fr'),
      space('gap', 'Gap', 'gap'),
      space('gap-x', 'Column gap', 'gap-x'),
      space('gap-y', 'Row gap', 'gap-y'),
      kw('justify', 'Justify content', 'justify-start justify-end justify-center justify-between justify-around justify-evenly justify-stretch justify-normal'),
      kw('justify-items', 'Justify items', 'justify-items-start justify-items-end justify-items-center justify-items-stretch justify-items-normal'),
      kw('justify-self', 'Justify self', 'justify-self-auto justify-self-start justify-self-end justify-self-center justify-self-stretch'),
      kw('align-content', 'Align content', 'content-normal content-center content-start content-end content-between content-around content-evenly content-baseline content-stretch'),
      kw('align-items', 'Align items', 'items-start items-end items-center items-baseline items-stretch'),
      kw('align-self', 'Align self', 'self-auto self-start self-end self-center self-stretch self-baseline'),
      kw('place-content', 'Place content', 'place-content-center place-content-start place-content-end place-content-between place-content-around place-content-evenly place-content-baseline place-content-stretch'),
      kw('place-items', 'Place items', 'place-items-start place-items-end place-items-center place-items-baseline place-items-stretch'),
      kw('place-self', 'Place self', 'place-self-auto place-self-start place-self-end place-self-center place-self-stretch'),
    ],
  },
  {
    title: 'Spacing',
    props: [
      ...[['p', 'Padding'], ['px', 'Padding X'], ['py', 'Padding Y'], ['ps', 'Padding start'], ['pe', 'Padding end'], ['pt', 'Padding top'], ['pr', 'Padding right'], ['pb', 'Padding bottom'], ['pl', 'Padding left']].map(([p, l]) => space(`pad-${p}`, l, p)),
      ...[['m', 'Margin'], ['mx', 'Margin X'], ['my', 'Margin Y'], ['ms', 'Margin start'], ['me', 'Margin end'], ['mt', 'Margin top'], ['mr', 'Margin right'], ['mb', 'Margin bottom'], ['ml', 'Margin left']].map(([p, l]) =>
        opt(`mar-${p}`, l, [...SP.map((v) => `${p}-${v}`), `${p}-auto`, ...neg(p, SP)])),
    ],
  },
  {
    title: 'Sizing',
    props: [
      opt('w', 'Width', [...SP, ...FR, ...CS, 'auto', 'screen', 'min', 'max', 'fit', 'svw', 'lvw', 'dvw'].map((v) => `w-${v}`)),
      opt('min-w', 'Min width', [...SP, ...CS, 'full', 'screen', 'min', 'max', 'fit', 'auto'].map((v) => `min-w-${v}`)),
      opt('max-w', 'Max width', [...SP, ...CS, 'none', 'full', 'screen', 'min', 'max', 'fit'].map((v) => `max-w-${v}`)),
      opt('h', 'Height', [...SP, ...FR, 'auto', 'screen', 'min', 'max', 'fit', 'svh', 'lvh', 'dvh', 'lh'].map((v) => `h-${v}`)),
      opt('min-h', 'Min height', [...SP, 'full', 'screen', 'min', 'max', 'fit', 'auto', 'svh', 'lvh', 'dvh'].map((v) => `min-h-${v}`)),
      opt('max-h', 'Max height', [...SP, 'none', 'full', 'screen', 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'].map((v) => `max-h-${v}`)),
      opt('size', 'Width & height', [...SP, ...FR, 'auto', 'min', 'max', 'fit'].map((v) => `size-${v}`)),
      opt('inline-size', 'Inline size', [...SP, ...FR, ...CS, 'auto', 'screen', 'min', 'max', 'fit'].map((v) => `inline-${v}`)),
      opt('min-inline', 'Min inline size', [...SP, ...CS, 'full', 'auto', 'min', 'max', 'fit'].map((v) => `min-inline-${v}`)),
      opt('max-inline', 'Max inline size', [...SP, ...CS, 'none', 'full', 'min', 'max', 'fit'].map((v) => `max-inline-${v}`)),
      opt('block-size', 'Block size', [...SP, ...FR, 'auto', 'screen', 'min', 'max', 'fit'].map((v) => `block-${v}`)),
      opt('min-block', 'Min block size', [...SP, 'full', 'auto', 'min', 'max', 'fit'].map((v) => `min-block-${v}`)),
      opt('max-block', 'Max block size', [...SP, 'none', 'full', 'min', 'max', 'fit'].map((v) => `max-block-${v}`)),
    ],
  },
  {
    title: 'Typography',
    props: [
      kw('font-family', 'Font family', 'font-sans font-serif font-mono'),
      kw('font-size', 'Font size', 'text-xs text-sm text-base text-lg text-xl text-2xl text-3xl text-4xl text-5xl text-6xl text-7xl text-8xl text-9xl'),
      kw('font-smoothing', 'Font smoothing', 'antialiased subpixel-antialiased'),
      kw('font-style', 'Font style', 'italic not-italic'),
      kw('font-weight', 'Font weight', 'font-thin font-extralight font-light font-normal font-medium font-semibold font-bold font-extrabold font-black'),
      kw('font-stretch', 'Font stretch', 'font-stretch-ultra-condensed font-stretch-extra-condensed font-stretch-condensed font-stretch-semi-condensed font-stretch-normal font-stretch-semi-expanded font-stretch-expanded font-stretch-extra-expanded font-stretch-ultra-expanded'),
      kw('font-numeric', 'Font variant numeric', 'normal-nums ordinal slashed-zero lining-nums oldstyle-nums proportional-nums tabular-nums diagonal-fractions stacked-fractions'),
      free('font-features', 'Font feature settings', "font-features-['smcp']"),
      kw('tracking', 'Letter spacing', 'tracking-tighter tracking-tight tracking-normal tracking-wide tracking-wider tracking-widest'),
      kw('line-clamp', 'Line clamp', 'line-clamp-1 line-clamp-2 line-clamp-3 line-clamp-4 line-clamp-5 line-clamp-6 line-clamp-none'),
      kw('leading', 'Line height', 'leading-none leading-tight leading-snug leading-normal leading-relaxed leading-loose leading-3 leading-4 leading-5 leading-6 leading-7 leading-8 leading-9 leading-10'),
      kw('list-image', 'List style image', 'list-image-none'),
      kw('list-position', 'List style position', 'list-inside list-outside'),
      kw('list-type', 'List style type', 'list-none list-disc list-decimal'),
      kw('text-align', 'Text align', 'text-left text-center text-right text-justify text-start text-end'),
      col('text-color', 'Text color', 'text'),
      kw('deco-line', 'Text decoration', 'underline overline line-through no-underline'),
      col('deco-color', 'Decoration color', 'decoration'),
      kw('deco-style', 'Decoration style', 'decoration-solid decoration-double decoration-dotted decoration-dashed decoration-wavy'),
      kw('deco-thickness', 'Decoration thickness', 'decoration-auto decoration-from-font decoration-0 decoration-1 decoration-2 decoration-4 decoration-8'),
      kw('underline-offset', 'Underline offset', 'underline-offset-auto underline-offset-0 underline-offset-1 underline-offset-2 underline-offset-4 underline-offset-8'),
      kw('text-transform', 'Text transform', 'uppercase lowercase capitalize normal-case'),
      kw('text-overflow', 'Text overflow', 'truncate text-ellipsis text-clip'),
      kw('text-wrap', 'Text wrap', 'text-wrap text-nowrap text-balance text-pretty'),
      space('indent', 'Text indent', 'indent'),
      free('tab-size', 'Tab size', 'tab-4'),
      kw('v-align', 'Vertical align', 'align-baseline align-top align-middle align-bottom align-text-top align-text-bottom align-sub align-super'),
      kw('whitespace', 'White space', 'whitespace-normal whitespace-nowrap whitespace-pre whitespace-pre-line whitespace-pre-wrap whitespace-break-spaces'),
      kw('word-break', 'Word break', 'break-normal break-words break-all break-keep'),
      kw('overflow-wrap', 'Overflow wrap', 'wrap-break-word wrap-anywhere wrap-normal'),
      kw('hyphens', 'Hyphens', 'hyphens-none hyphens-manual hyphens-auto'),
      free('content', 'Content', "content-['→']"),
    ],
  },
  {
    title: 'Backgrounds',
    props: [
      kw('bg-attachment', 'Attachment', 'bg-fixed bg-local bg-scroll'),
      kw('bg-clip', 'Clip', 'bg-clip-border bg-clip-padding bg-clip-content bg-clip-text'),
      col('bg-color', 'Color', 'bg'),
      kw('bg-image', 'Image / gradient', 'bg-none bg-linear-to-t bg-linear-to-tr bg-linear-to-r bg-linear-to-br bg-linear-to-b bg-linear-to-bl bg-linear-to-l bg-linear-to-tl bg-radial bg-conic'),
      col('from', 'Gradient from', 'from'),
      col('via', 'Gradient via', 'via'),
      col('to', 'Gradient to', 'to'),
      kw('bg-origin', 'Origin', 'bg-origin-border bg-origin-padding bg-origin-content'),
      pf('bg-position', 'Position', 'bg', POS),
      kw('bg-repeat', 'Repeat', 'bg-repeat bg-no-repeat bg-repeat-x bg-repeat-y bg-repeat-round bg-repeat-space'),
      kw('bg-size', 'Size', 'bg-auto bg-cover bg-contain'),
    ],
  },
  {
    title: 'Borders',
    props: [
      radius('rounded', 'Border radius', 'rounded'),
      radius('rounded-t', 'Radius top', 'rounded-t'),
      radius('rounded-b', 'Radius bottom', 'rounded-b'),
      radius('rounded-l', 'Radius left', 'rounded-l'),
      radius('rounded-r', 'Radius right', 'rounded-r'),
      radius('rounded-tl', 'Radius top-left', 'rounded-tl'),
      radius('rounded-tr', 'Radius top-right', 'rounded-tr'),
      radius('rounded-br', 'Radius bottom-right', 'rounded-br'),
      radius('rounded-bl', 'Radius bottom-left', 'rounded-bl'),
      ...[['border', 'Border width'], ['border-x', 'Border width X'], ['border-y', 'Border width Y'], ['border-t', 'Border top'], ['border-r', 'Border right'], ['border-b', 'Border bottom'], ['border-l', 'Border left']].map(([p, l]) =>
        opt(p, l, [p, `${p}-0`, `${p}-2`, `${p}-4`, `${p}-8`])),
      col('border-color', 'Border color', 'border'),
      kw('border-style', 'Border style', 'border-solid border-dashed border-dotted border-double border-hidden border-none'),
      kw('outline-width', 'Outline width', 'outline outline-0 outline-1 outline-2 outline-4 outline-8'),
      col('outline-color', 'Outline color', 'outline'),
      kw('outline-style', 'Outline style', 'outline-solid outline-dashed outline-dotted outline-double outline-hidden outline-none'),
      kw('outline-offset', 'Outline offset', 'outline-offset-0 outline-offset-1 outline-offset-2 outline-offset-4 outline-offset-8'),
    ],
  },
  {
    title: 'Effects',
    props: [
      kw('shadow', 'Box shadow', 'shadow-2xs shadow-xs shadow-sm shadow-md shadow-lg shadow-xl shadow-2xl shadow-none'),
      col('shadow-color', 'Shadow color', 'shadow'),
      kw('ring', 'Ring width', 'ring ring-0 ring-1 ring-2 ring-4 ring-8'),
      col('ring-color', 'Ring color', 'ring'),
      kw('text-shadow', 'Text shadow', 'text-shadow-2xs text-shadow-xs text-shadow-sm text-shadow-md text-shadow-lg text-shadow-none'),
      pf('opacity', 'Opacity', 'opacity', w('0 5 10 20 25 30 40 50 60 70 75 80 90 95 100')),
      pf('mix-blend', 'Mix blend mode', 'mix-blend', [...BLEND, 'plus-darker', 'plus-lighter']),
      pf('bg-blend', 'Background blend mode', 'bg-blend', BLEND),
      kw('mask-clip', 'Mask clip', 'mask-clip-border mask-clip-padding mask-clip-content mask-clip-fill mask-clip-stroke mask-clip-view mask-no-clip'),
      kw('mask-composite', 'Mask composite', 'mask-add mask-subtract mask-intersect mask-exclude'),
      free('mask-image', 'Mask image', 'mask-b-from-50%'),
      kw('mask-mode', 'Mask mode', 'mask-alpha mask-luminance mask-match'),
      kw('mask-origin', 'Mask origin', 'mask-origin-border mask-origin-padding mask-origin-content mask-origin-fill mask-origin-stroke mask-origin-view'),
      pf('mask-position', 'Mask position', 'mask', POS),
      kw('mask-repeat', 'Mask repeat', 'mask-repeat mask-no-repeat mask-repeat-x mask-repeat-y mask-repeat-round mask-repeat-space'),
      kw('mask-size', 'Mask size', 'mask-auto mask-cover mask-contain'),
      kw('mask-type', 'Mask type', 'mask-type-alpha mask-type-luminance'),
    ],
  },
  {
    title: 'Filters',
    props: [
      kw('blur', 'Blur', 'blur-none blur-xs blur-sm blur-md blur-lg blur-xl blur-2xl blur-3xl'),
      pf('brightness', 'Brightness', 'brightness', [...PCT, '50']),
      pf('contrast', 'Contrast', 'contrast', ['0', '50', '75', '100', '125', '150', '200']),
      kw('drop-shadow', 'Drop shadow', 'drop-shadow-xs drop-shadow-sm drop-shadow-md drop-shadow-lg drop-shadow-xl drop-shadow-2xl drop-shadow-none'),
      kw('grayscale', 'Grayscale', 'grayscale grayscale-0'),
      pf('hue-rotate', 'Hue rotate', 'hue-rotate', w('0 15 30 60 90 180')),
      kw('invert', 'Invert', 'invert invert-0'),
      pf('saturate', 'Saturate', 'saturate', ['0', '50', '100', '150', '200']),
      kw('sepia', 'Sepia', 'sepia sepia-0'),
      kw('backdrop-blur', 'Backdrop blur', 'backdrop-blur-none backdrop-blur-xs backdrop-blur-sm backdrop-blur-md backdrop-blur-lg backdrop-blur-xl backdrop-blur-2xl backdrop-blur-3xl'),
      pf('backdrop-brightness', 'Backdrop brightness', 'backdrop-brightness', PCT),
      pf('backdrop-contrast', 'Backdrop contrast', 'backdrop-contrast', ['0', '50', '75', '100', '125', '150', '200']),
      kw('backdrop-grayscale', 'Backdrop grayscale', 'backdrop-grayscale backdrop-grayscale-0'),
      pf('backdrop-hue', 'Backdrop hue rotate', 'backdrop-hue-rotate', w('0 15 30 60 90 180')),
      kw('backdrop-invert', 'Backdrop invert', 'backdrop-invert backdrop-invert-0'),
      pf('backdrop-opacity', 'Backdrop opacity', 'backdrop-opacity', w('0 5 10 20 25 30 40 50 60 70 75 80 90 95 100')),
      pf('backdrop-saturate', 'Backdrop saturate', 'backdrop-saturate', ['0', '50', '100', '150', '200']),
      kw('backdrop-sepia', 'Backdrop sepia', 'backdrop-sepia backdrop-sepia-0'),
    ],
  },
  {
    title: 'Tables',
    props: [
      kw('border-collapse', 'Border collapse', 'border-collapse border-separate'),
      space('border-spacing', 'Border spacing', 'border-spacing'),
      kw('table-layout', 'Table layout', 'table-auto table-fixed'),
      kw('caption-side', 'Caption side', 'caption-top caption-bottom'),
    ],
  },
  {
    title: 'Transitions & Animation',
    props: [
      kw('transition', 'Transition property', `${T} ${T}-all ${T}-colors ${T}-opacity ${T}-shadow ${T}-transform ${T}-none`),
      kw('transition-behavior', 'Transition behavior', `${T}-normal ${T}-discrete`),
      pf('duration', 'Duration', 'duration', w('0 75 100 150 200 300 500 700 1000')),
      kw('ease', 'Timing function', 'ease-linear ease-in ease-out ease-in-out'),
      pf('delay', 'Delay', 'delay', w('0 75 100 150 200 300 500 700 1000')),
      kw('animate', 'Animation', 'animate-none animate-spin animate-ping animate-pulse animate-bounce'),
    ],
  },
  {
    title: 'Transforms',
    props: [
      kw('backface', 'Backface visibility', 'backface-hidden backface-visible'),
      pf('perspective', 'Perspective', 'perspective', w('none dramatic near normal midrange distant')),
      pf('perspective-origin', 'Perspective origin', 'perspective-origin', ['center', ...POS.filter((p) => p !== 'center')]),
      opt('rotate', 'Rotate', [...w('0 1 2 3 6 12 45 90 180').map((v) => `rotate-${v}`), ...neg('rotate', w('1 2 3 6 12 45 90 180'))]),
      pf('scale', 'Scale', 'scale', w('0 50 75 90 95 100 105 110 125 150')),
      pf('scale-x', 'Scale X', 'scale-x', w('0 50 75 90 95 100 105 110 125 150')),
      pf('scale-y', 'Scale Y', 'scale-y', w('0 50 75 90 95 100 105 110 125 150')),
      opt('skew-x', 'Skew X', [...w('0 1 2 3 6 12').map((v) => `skew-x-${v}`), ...neg('skew-x', w('1 2 3 6 12'))]),
      opt('skew-y', 'Skew Y', [...w('0 1 2 3 6 12').map((v) => `skew-y-${v}`), ...neg('skew-y', w('1 2 3 6 12'))]),
      kw('transform', 'Transform', 'transform-none transform-gpu transform-cpu'),
      pf('origin', 'Transform origin', 'origin', ['center', ...POS.filter((p) => p !== 'center')]),
      kw('transform-style', 'Transform style', 'transform-3d transform-flat'),
      opt('translate-x', 'Translate X', [...SP, ...FR].map((v) => `translate-x-${v}`).concat(neg('translate-x', [...SP, ...FR]))),
      opt('translate-y', 'Translate Y', [...SP, ...FR].map((v) => `translate-y-${v}`).concat(neg('translate-y', [...SP, ...FR]))),
      pf('zoom', 'Zoom', 'zoom', w('50 75 90 100 110 125 150 200')),
    ],
  },
  {
    title: 'Interactivity',
    props: [
      col('accent', 'Accent color', 'accent'),
      kw('appearance', 'Appearance', 'appearance-none appearance-auto'),
      col('caret', 'Caret color', 'caret'),
      kw('color-scheme', 'Color scheme', 'scheme-normal scheme-dark scheme-light scheme-light-dark scheme-only-dark scheme-only-light'),
      kw('cursor', 'Cursor', 'cursor-auto cursor-default cursor-pointer cursor-wait cursor-text cursor-move cursor-help cursor-not-allowed cursor-none cursor-context-menu cursor-progress cursor-cell cursor-crosshair cursor-vertical-text cursor-alias cursor-copy cursor-no-drop cursor-grab cursor-grabbing cursor-all-scroll cursor-col-resize cursor-row-resize cursor-n-resize cursor-e-resize cursor-s-resize cursor-w-resize cursor-ne-resize cursor-nw-resize cursor-se-resize cursor-sw-resize cursor-ew-resize cursor-ns-resize cursor-nesw-resize cursor-nwse-resize cursor-zoom-in cursor-zoom-out'),
      kw('field-sizing', 'Field sizing', 'field-sizing-content field-sizing-fixed'),
      kw('pointer-events', 'Pointer events', 'pointer-events-none pointer-events-auto'),
      kw('resize', 'Resize', 'resize-none resize-y resize-x resize'),
      kw('scroll-behavior', 'Scroll behavior', 'scroll-auto scroll-smooth'),
      free('scrollbar-color', 'Scrollbar color', 'scrollbar-thumb-slate-400'),
      free('scrollbar-width', 'Scrollbar width', 'scrollbar-thin'),
      free('scrollbar-gutter', 'Scrollbar gutter', 'scrollbar-stable'),
      space('scroll-m', 'Scroll margin', 'scroll-m'),
      space('scroll-p', 'Scroll padding', 'scroll-p'),
      kw('snap-align', 'Scroll snap align', 'snap-start snap-end snap-center snap-align-none'),
      kw('snap-stop', 'Scroll snap stop', 'snap-normal snap-always'),
      kw('snap-type', 'Scroll snap type', 'snap-none snap-x snap-y snap-both snap-mandatory snap-proximity'),
      kw('touch', 'Touch action', 'touch-auto touch-none touch-pan-x touch-pan-left touch-pan-right touch-pan-y touch-pan-up touch-pan-down touch-pinch-zoom touch-manipulation'),
      kw('select', 'User select', 'select-none select-text select-all select-auto'),
      kw('will-change', 'Will change', 'will-change-auto will-change-scroll will-change-contents will-change-transform'),
    ],
  },
  {
    title: 'SVG',
    props: [col('fill', 'Fill', 'fill'), col('stroke', 'Stroke', 'stroke'), kw('stroke-width', 'Stroke width', 'stroke-0 stroke-1 stroke-2')],
  },
]

// Quick controls that a Tailwind-panel value replaces, so the two never fight over one property.
export const OVERRIDES: Record<string, string> = { 'bg-color': 'bg', 'text-color': 'color', 'font-size': 'size', 'text-align': 'align', rounded: 'rounded', shadow: 'shadow', border: 'border' }

export const VARIANTS = ['base', 'sm', 'md', 'lg', 'xl', '2xl', 'hover', 'focus'] as const
// stored as "<variant>|<propId>" -> class name
export const twClasses = (t: Record<string, string> = {}) =>
  Object.entries(t)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const variant = k.split('|')[0]
      return variant === 'base' ? v : `${variant}:${v}`
    })

// Does class `c` belong to property `id`? Used to drop a block's built-in default when the panel sets that property.
const PROPS = Object.fromEntries(GROUPS.flatMap((g) => g.props).map((p) => [p.id, p]))
export const sameProp = (id: string, c: string) => {
  const p = PROPS[id]
  if (!p) return false
  if (p.k === 'opt') return p.o!.includes(c)
  if (p.k === 'color') {
    const rest = c.startsWith(p.pre + '-') ? c.slice(p.pre!.length + 1) : ''
    return SPECIAL.includes(rest) || PALETTES.some((x) => rest.startsWith(x + '-'))
  }
  return false
}
