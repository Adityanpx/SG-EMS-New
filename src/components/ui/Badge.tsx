import { cn } from '@/lib/utils'

const badgeVariants = {
  // Blue variants (10 total)
  'blue-500': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'blue-400': 'bg-blue-400/10 text-blue-500 border-blue-400/20',
  'blue-300': 'bg-blue-300/10 text-blue-400 border-blue-300/20',
  'blue-200': 'bg-blue-200/10 text-blue-300 border-blue-200/20',
  'blue-100': 'bg-blue-100/10 text-blue-200 border-blue-100/20',
  'blue-600': 'bg-blue-600/10 text-blue-700 border-blue-600/20',
  'blue-700': 'bg-blue-700/10 text-blue-800 border-blue-700/20',
  'blue-800': 'bg-blue-800/10 text-blue-900 border-blue-800/20',
  'blue-900': 'bg-blue-900/10 text-blue-950 border-blue-900/20',
  'blue-950': 'bg-blue-950/10 text-blue-50 border-blue-950/20',
  
  // Brand variants (10 total)
  'brand-500': 'bg-brand-500/10 text-brand-600 border-brand-500/20',
  'brand-400': 'bg-brand-400/10 text-brand-500 border-brand-400/20',
  'brand-300': 'bg-brand-300/10 text-brand-400 border-brand-300/20',
  'brand-200': 'bg-brand-200/10 text-brand-300 border-brand-200/20',
  'brand-100': 'bg-brand-100/10 text-brand-200 border-brand-100/20',
  'brand-600': 'bg-brand-600/10 text-brand-700 border-brand-600/20',
  'brand-700': 'bg-brand-700/10 text-brand-800 border-brand-700/20',
  'brand-800': 'bg-brand-800/10 text-brand-900 border-brand-800/20',
  'brand-900': 'bg-brand-900/10 text-brand-950 border-brand-900/20',
  'brand-950': 'bg-brand-950/10 text-brand-50 border-brand-950/20',
  
  // Green variants (10 total)
  'green-500': 'bg-green-500/10 text-green-600 border-green-500/20',
  'green-400': 'bg-green-400/10 text-green-500 border-green-400/20',
  'green-300': 'bg-green-300/10 text-green-400 border-green-300/20',
  'green-200': 'bg-green-200/10 text-green-300 border-green-200/20',
  'green-100': 'bg-green-100/10 text-green-200 border-green-100/20',
  'green-600': 'bg-green-600/10 text-green-700 border-green-600/20',
  'green-700': 'bg-green-700/10 text-green-800 border-green-700/20',
  'green-800': 'bg-green-800/10 text-green-900 border-green-800/20',
  'green-900': 'bg-green-900/10 text-green-950 border-green-900/20',
  'green-950': 'bg-green-950/10 text-green-50 border-green-950/20',
  
  // Red variants (10 total)
  'red-500': 'bg-red-500/10 text-red-600 border-red-500/20',
  'red-400': 'bg-red-400/10 text-red-500 border-red-400/20',
  'red-300': 'bg-red-300/10 text-red-400 border-red-300/20',
  'red-200': 'bg-red-200/10 text-red-300 border-red-200/20',
  'red-100': 'bg-red-100/10 text-red-200 border-red-100/20',
  'red-600': 'bg-red-600/10 text-red-700 border-red-600/20',
  'red-700': 'bg-red-700/10 text-red-800 border-red-700/20',
  'red-800': 'bg-red-800/10 text-red-900 border-red-800/20',
  'red-900': 'bg-red-900/10 text-red-950 border-red-900/20',
  'red-950': 'bg-red-950/10 text-red-50 border-red-950/20',
  
  // Yellow variants (10 total)
  'yellow-500': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'yellow-400': 'bg-yellow-400/10 text-yellow-500 border-yellow-400/20',
  'yellow-300': 'bg-yellow-300/10 text-yellow-400 border-yellow-300/20',
  'yellow-200': 'bg-yellow-200/10 text-yellow-300 border-yellow-200/20',
  'yellow-100': 'bg-yellow-100/10 text-yellow-200 border-yellow-100/20',
  'yellow-600': 'bg-yellow-600/10 text-yellow-700 border-yellow-600/20',
  'yellow-700': 'bg-yellow-700/10 text-yellow-800 border-yellow-700/20',
  'yellow-800': 'bg-yellow-800/10 text-yellow-900 border-yellow-800/20',
  'yellow-900': 'bg-yellow-900/10 text-yellow-950 border-yellow-900/20',
  'yellow-950': 'bg-yellow-950/10 text-yellow-50 border-yellow-950/20',
  
  // Purple variants (10 total)
  'purple-500': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'purple-400': 'bg-purple-400/10 text-purple-500 border-purple-400/20',
  'purple-300': 'bg-purple-300/10 text-purple-400 border-purple-300/20',
  'purple-200': 'bg-purple-200/10 text-purple-300 border-purple-200/20',
  'purple-100': 'bg-purple-100/10 text-purple-200 border-purple-100/20',
  'purple-600': 'bg-purple-600/10 text-purple-700 border-purple-600/20',
  'purple-700': 'bg-purple-700/10 text-purple-800 border-purple-700/20',
  'purple-800': 'bg-purple-800/10 text-purple-900 border-purple-800/20',
  'purple-900': 'bg-purple-900/10 text-purple-950 border-purple-900/20',
  'purple-950': 'bg-purple-950/10 text-purple-50 border-purple-950/20',
  
  // Pink variants (10 total)
  'pink-500': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  'pink-400': 'bg-pink-400/10 text-pink-500 border-pink-400/20',
  'pink-300': 'bg-pink-300/10 text-pink-400 border-pink-300/20',
  'pink-200': 'bg-pink-200/10 text-pink-300 border-pink-200/20',
  'pink-100': 'bg-pink-100/10 text-pink-200 border-pink-100/20',
  'pink-600': 'bg-pink-600/10 text-pink-700 border-pink-600/20',
  'pink-700': 'bg-pink-700/10 text-pink-800 border-pink-700/20',
  'pink-800': 'bg-pink-800/10 text-pink-900 border-pink-800/20',
  'pink-900': 'bg-pink-900/10 text-pink-950 border-pink-900/20',
  'pink-950': 'bg-pink-950/10 text-pink-50 border-pink-950/20',
  
  // Orange variants (10 total)
  'orange-500': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'orange-400': 'bg-orange-400/10 text-orange-500 border-orange-400/20',
  'orange-300': 'bg-orange-300/10 text-orange-400 border-orange-300/20',
  'orange-200': 'bg-orange-200/10 text-orange-300 border-orange-200/20',
  'orange-100': 'bg-orange-100/10 text-orange-200 border-orange-100/20',
  'orange-600': 'bg-orange-600/10 text-orange-700 border-orange-600/20',
  'orange-700': 'bg-orange-700/10 text-orange-800 border-orange-700/20',
  'orange-800': 'bg-orange-800/10 text-orange-900 border-orange-800/20',
  'orange-900': 'bg-orange-900/10 text-orange-950 border-orange-900/20',
  'orange-950': 'bg-orange-950/10 text-orange-50 border-orange-950/20',
  
  // Slate variants (10 total)
  'slate-500': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  'slate-400': 'bg-slate-400/10 text-slate-500 border-slate-400/20',
  'slate-300': 'bg-slate-300/10 text-slate-400 border-slate-300/20',
  'slate-200': 'bg-slate-200/10 text-slate-300 border-slate-200/20',
  'slate-100': 'bg-slate-100/10 text-slate-200 border-slate-100/20',
  'slate-600': 'bg-slate-600/10 text-slate-700 border-slate-600/20',
  'slate-700': 'bg-slate-700/10 text-slate-800 border-slate-700/20',
  'slate-800': 'bg-slate-800/10 text-slate-900 border-slate-800/20',
  'slate-900': 'bg-slate-900/10 text-slate-950 border-slate-900/20',
  'slate-950': 'bg-slate-950/10 text-slate-50 border-slate-950/20',
  
  // Gray variants (10 total)
  'gray-500': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  'gray-400': 'bg-gray-400/10 text-gray-500 border-gray-400/20',
  'gray-300': 'bg-gray-300/10 text-gray-400 border-gray-300/20',
  'gray-200': 'bg-gray-200/10 text-gray-300 border-gray-200/20',
  'gray-100': 'bg-gray-100/10 text-gray-200 border-gray-100/20',
  'gray-600': 'bg-gray-600/10 text-gray-700 border-gray-600/20',
  'gray-700': 'bg-gray-700/10 text-gray-800 border-gray-700/20',
  'gray-800': 'bg-gray-800/10 text-gray-900 border-gray-800/20',
  'gray-900': 'bg-gray-900/10 text-gray-950 border-gray-900/20',
  'gray-950': 'bg-gray-950/10 text-gray-50 border-gray-950/20',
  
  // Teal variants (10 total)
  'teal-500': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'teal-400': 'bg-teal-400/10 text-teal-500 border-teal-400/20',
  'teal-300': 'bg-teal-300/10 text-teal-400 border-teal-300/20',
  'teal-200': 'bg-teal-200/10 text-teal-300 border-teal-200/20',
  'teal-100': 'bg-teal-100/10 text-teal-200 border-teal-100/20',
  'teal-600': 'bg-teal-600/10 text-teal-700 border-teal-600/20',
  'teal-700': 'bg-teal-700/10 text-teal-800 border-teal-700/20',
  'teal-800': 'bg-teal-800/10 text-teal-900 border-teal-800/20',
  'teal-900': 'bg-teal-900/10 text-teal-950 border-teal-900/20',
  'teal-950': 'bg-teal-950/10 text-teal-50 border-teal-950/20',
  
  // Cyan variants (10 total)
  'cyan-500': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'cyan-400': 'bg-cyan-400/10 text-cyan-500 border-cyan-400/20',
  'cyan-300': 'bg-cyan-300/10 text-cyan-400 border-cyan-300/20',
  'cyan-200': 'bg-cyan-200/10 text-cyan-300 border-cyan-200/20',
  'cyan-100': 'bg-cyan-100/10 text-cyan-200 border-cyan-100/20',
  'cyan-600': 'bg-cyan-600/10 text-cyan-700 border-cyan-600/20',
  'cyan-700': 'bg-cyan-700/10 text-cyan-800 border-cyan-700/20',
  'cyan-800': 'bg-cyan-800/10 text-cyan-900 border-cyan-800/20',
  'cyan-900': 'bg-cyan-900/10 text-cyan-950 border-cyan-900/20',
  'cyan-950': 'bg-cyan-950/10 text-cyan-50 border-cyan-950/20',
  
  // Indigo variants (10 total)
  'indigo-500': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'indigo-400': 'bg-indigo-400/10 text-indigo-500 border-indigo-400/20',
  'indigo-300': 'bg-indigo-300/10 text-indigo-400 border-indigo-300/20',
  'indigo-200': 'bg-indigo-200/10 text-indigo-300 border-indigo-200/20',
  'indigo-100': 'bg-indigo-100/10 text-indigo-200 border-indigo-100/20',
  'indigo-600': 'bg-indigo-600/10 text-indigo-700 border-indigo-600/20',
  'indigo-700': 'bg-indigo-700/10 text-indigo-800 border-indigo-700/20',
  'indigo-800': 'bg-indigo-800/10 text-indigo-900 border-indigo-800/20',
  'indigo-900': 'bg-indigo-900/10 text-indigo-950 border-indigo-900/20',
  'indigo-950': 'bg-indigo-950/10 text-indigo-50 border-indigo-950/20',
  
  // Violet variants (10 total)
  'violet-500': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'violet-400': 'bg-violet-400/10 text-violet-500 border-violet-400/20',
  'violet-300': 'bg-violet-300/10 text-violet-400 border-violet-300/20',
  'violet-200': 'bg-violet-200/10 text-violet-300 border-violet-200/20',
  'violet-100': 'bg-violet-100/10 text-violet-200 border-violet-100/20',
  'violet-600': 'bg-violet-600/10 text-violet-700 border-violet-600/20',
  'violet-700': 'bg-violet-700/10 text-violet-800 border-violet-700/20',
  'violet-800': 'bg-violet-800/10 text-violet-900 border-violet-800/20',
  'violet-900': 'bg-violet-900/10 text-violet-950 border-violet-900/20',
  'violet-950': 'bg-violet-950/10 text-violet-50 border-violet-950/20',
  
  // Amber variants (10 total)
  'amber-500': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'amber-400': 'bg-amber-400/10 text-amber-500 border-amber-400/20',
  'amber-300': 'bg-amber-300/10 text-amber-400 border-amber-300/20',
  'amber-200': 'bg-amber-200/10 text-amber-300 border-amber-200/20',
  'amber-100': 'bg-amber-100/10 text-amber-200 border-amber-100/20',
  'amber-600': 'bg-amber-600/10 text-amber-700 border-amber-600/20',
  'amber-700': 'bg-amber-700/10 text-amber-800 border-amber-700/20',
  'amber-800': 'bg-amber-800/10 text-amber-900 border-amber-800/20',
  'amber-900': 'bg-amber-900/10 text-amber-950 border-amber-900/20',
  'amber-950': 'bg-amber-950/10 text-amber-50 border-amber-950/20',
  
  // Lime variants (10 total)
  'lime-500': 'bg-lime-500/10 text-lime-600 border-lime-500/20',
  'lime-400': 'bg-lime-400/10 text-lime-500 border-lime-400/20',
  'lime-300': 'bg-lime-300/10 text-lime-400 border-lime-300/20',
  'lime-200': 'bg-lime-200/10 text-lime-300 border-lime-200/20',
  'lime-100': 'bg-lime-100/10 text-lime-200 border-lime-100/20',
  'lime-600': 'bg-lime-600/10 text-lime-700 border-lime-600/20',
  'lime-700': 'bg-lime-700/10 text-lime-800 border-lime-700/20',
  'lime-800': 'bg-lime-800/10 text-lime-900 border-lime-800/20',
  'lime-900': 'bg-lime-900/10 text-lime-950 border-lime-900/20',
  'lime-950': 'bg-lime-950/10 text-lime-50 border-lime-950/20',
  
  // Emerald variants (10 total)
  'emerald-500': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'emerald-400': 'bg-emerald-400/10 text-emerald-500 border-emerald-400/20',
  'emerald-300': 'bg-emerald-300/10 text-emerald-400 border-emerald-300/20',
  'emerald-200': 'bg-emerald-200/10 text-emerald-300 border-emerald-200/20',
  'emerald-100': 'bg-emerald-100/10 text-emerald-200 border-emerald-100/20',
  'emerald-600': 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20',
  'emerald-700': 'bg-emerald-700/10 text-emerald-800 border-emerald-700/20',
  'emerald-800': 'bg-emerald-800/10 text-emerald-900 border-emerald-800/20',
  'emerald-900': 'bg-emerald-900/10 text-emerald-950 border-emerald-900/20',
  'emerald-950': 'bg-emerald-950/10 text-emerald-50 border-emerald-950/20',
  
  // Rose variants (10 total)
  'rose-500': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  'rose-400': 'bg-rose-400/10 text-rose-500 border-rose-400/20',
  'rose-300': 'bg-rose-300/10 text-rose-400 border-rose-300/20',
  'rose-200': 'bg-rose-200/10 text-rose-300 border-rose-200/20',
  'rose-100': 'bg-rose-100/10 text-rose-200 border-rose-100/20',
  'rose-600': 'bg-rose-600/10 text-rose-700 border-rose-600/20',
  'rose-700': 'bg-rose-700/10 text-rose-800 border-rose-700/20',
  'rose-800': 'bg-rose-800/10 text-rose-900 border-rose-800/20',
  'rose-900': 'bg-rose-900/10 text-rose-950 border-rose-900/20',
  'rose-950': 'bg-rose-950/10 text-rose-50 border-rose-950/20',
  
  // Fuchsia variants (10 total)
  'fuchsia-500': 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20',
  'fuchsia-400': 'bg-fuchsia-400/10 text-fuchsia-500 border-fuchsia-400/20',
  'fuchsia-300': 'bg-fuchsia-300/10 text-fuchsia-400 border-fuchsia-300/20',
  'fuchsia-200': 'bg-fuchsia-200/10 text-fuchsia-300 border-fuchsia-200/20',
  'fuchsia-100': 'bg-fuchsia-100/10 text-fuchsia-200 border-fuchsia-100/20',
  'fuchsia-600': 'bg-fuchsia-600/10 text-fuchsia-700 border-fuchsia-600/20',
  'fuchsia-700': 'bg-fuchsia-700/10 text-fuchsia-800 border-fuchsia-700/20',
  'fuchsia-800': 'bg-fuchsia-800/10 text-fuchsia-900 border-fuchsia-800/20',
  'fuchsia-900': 'bg-fuchsia-900/10 text-fuchsia-950 border-fuchsia-900/20',
  'fuchsia-950': 'bg-fuchsia-950/10 text-fuchsia-50 border-fuchsia-950/20',
  
  // Zinc variants (10 total)
  'zinc-500': 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
  'zinc-400': 'bg-zinc-400/10 text-zinc-500 border-zinc-400/20',
  'zinc-300': 'bg-zinc-300/10 text-zinc-400 border-zinc-300/20',
  'zinc-200': 'bg-zinc-200/10 text-zinc-300 border-zinc-200/20',
  'zinc-100': 'bg-zinc-100/10 text-zinc-200 border-zinc-100/20',
  'zinc-600': 'bg-zinc-600/10 text-zinc-700 border-zinc-600/20',
  'zinc-700': 'bg-zinc-700/10 text-zinc-800 border-zinc-700/20',
  'zinc-800': 'bg-zinc-800/10 text-zinc-900 border-zinc-800/20',
  'zinc-900': 'bg-zinc-900/10 text-zinc-950 border-zinc-900/20',
  'zinc-950': 'bg-zinc-950/10 text-zinc-50 border-zinc-950/20',
  
  // Neutral variants (10 total)
  'neutral-500': 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20',
  'neutral-400': 'bg-neutral-400/10 text-neutral-500 border-neutral-400/20',
  'neutral-300': 'bg-neutral-300/10 text-neutral-400 border-neutral-300/20',
  'neutral-200': 'bg-neutral-200/10 text-neutral-300 border-neutral-200/20',
  'neutral-100': 'bg-neutral-100/10 text-neutral-200 border-neutral-100/20',
  'neutral-600': 'bg-neutral-600/10 text-neutral-700 border-neutral-600/20',
  'neutral-700': 'bg-neutral-700/10 text-neutral-800 border-neutral-700/20',
  'neutral-800': 'bg-neutral-800/10 text-neutral-900 border-neutral-800/20',
  'neutral-900': 'bg-neutral-900/10 text-neutral-950 border-neutral-900/20',
  'neutral-950': 'bg-neutral-950/10 text-neutral-50 border-neutral-950/20',
  
  // Stone variants (10 total)
  'stone-500': 'bg-stone-500/10 text-stone-600 border-stone-500/20',
  'stone-400': 'bg-stone-400/10 text-stone-500 border-stone-400/20',
  'stone-300': 'bg-stone-300/10 text-stone-400 border-stone-300/20',
  'stone-200': 'bg-stone-200/10 text-stone-300 border-stone-200/20',
  'stone-100': 'bg-stone-100/10 text-stone-200 border-stone-100/20',
  'stone-600': 'bg-stone-600/10 text-stone-700 border-stone-600/20',
  'stone-700': 'bg-stone-700/10 text-stone-800 border-stone-700/20',
  'stone-800': 'bg-stone-800/10 text-stone-900 border-stone-800/20',
  'stone-900': 'bg-stone-900/10 text-stone-950 border-stone-900/20',
  'stone-950': 'bg-stone-950/10 text-stone-50 border-stone-950/20',
  
  // Sky variants (10 total)
  'sky-500': 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  'sky-400': 'bg-sky-400/10 text-sky-500 border-sky-400/20',
  'sky-300': 'bg-sky-300/10 text-sky-400 border-sky-300/20',
  'sky-200': 'bg-sky-200/10 text-sky-300 border-sky-200/20',
  'sky-100': 'bg-sky-100/10 text-sky-200 border-sky-100/20',
  'sky-600': 'bg-sky-600/10 text-sky-700 border-sky-600/20',
  'sky-700': 'bg-sky-700/10 text-sky-800 border-sky-700/20',
  'sky-800': 'bg-sky-800/10 text-sky-900 border-sky-800/20',
  'sky-900': 'bg-sky-900/10 text-sky-950 border-sky-900/20',
  'sky-950': 'bg-sky-950/10 text-sky-50 border-sky-950/20',
  
  // Warm gray variants (10 total)
  'warmgray-500': 'bg-warmgray-500/10 text-warmgray-600 border-warmgray-500/20',
  'warmgray-400': 'bg-warmgray-400/10 text-warmgray-500 border-warmgray-400/20',
  'warmgray-300': 'bg-warmgray-300/10 text-warmgray-400 border-warmgray-300/20',
  'warmgray-200': 'bg-warmgray-200/10 text-warmgray-300 border-warmgray-200/20',
  'warmgray-100': 'bg-warmgray-100/10 text-warmgray-200 border-warmgray-100/20',
  'warmgray-600': 'bg-warmgray-600/10 text-warmgray-700 border-warmgray-600/20',
  'warmgray-700': 'bg-warmgray-700/10 text-warmgray-800 border-warmgray-700/20',
  'warmgray-800': 'bg-warmgray-800/10 text-warmgray-900 border-warmgray-800/20',
  'warmgray-900': 'bg-warmgray-900/10 text-warmgray-950 border-warmgray-900/20',
  'warmgray-950': 'bg-warmgray-950/10 text-warmgray-50 border-warmgray-950/20',
  
  // Cool gray variants (10 total)
  'coolgray-500': 'bg-coolgray-500/10 text-coolgray-600 border-coolgray-500/20',
  'coolgray-400': 'bg-coolgray-400/10 text-coolgray-500 border-coolgray-400/20',
  'coolgray-300': 'bg-coolgray-300/10 text-coolgray-400 border-coolgray-300/20',
  'coolgray-200': 'bg-coolgray-200/10 text-coolgray-300 border-coolgray-200/20',
  'coolgray-100': 'bg-coolgray-100/10 text-coolgray-200 border-coolgray-100/20',
  'coolgray-600': 'bg-coolgray-600/10 text-coolgray-700 border-coolgray-600/20',
  'coolgray-700': 'bg-coolgray-700/10 text-coolgray-800 border-coolgray-700/20',
  'coolgray-800': 'bg-coolgray-800/10 text-coolgray-900 border-coolgray-800/20',
  'coolgray-900': 'bg-coolgray-900/10 text-coolgray-950 border-coolgray-900/20',
  'coolgray-950': 'bg-coolgray-950/10 text-coolgray-50 border-coolgray-950/20',
  
  // Custom status variants
  'present': 'bg-green-500/10 text-green-600 border-green-500/20',
  'absent': 'bg-red-500/10 text-red-600 border-red-500/20',
  'wfh': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  
  // Priority variants
  'low': 'bg-slate-100 text-slate-600 border-slate-200',
  'medium': 'bg-amber-100 text-amber-700 border-amber-200',
  'high': 'bg-red-100 text-red-700 border-red-200',
}

type BadgeProps = {
  variant?: keyof typeof badgeVariants
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'brand-500', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  )
}