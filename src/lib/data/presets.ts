import type {
  AspectRatio,
  CameraMovement,
  PosterPalette,
  VideoDuration,
} from "@/types";
import { HOTEL_LOBBY_PROMPT } from "@/lib/data/presets/hotel-lobby-prompt";
import { CAR_POOL_PROMPT } from "@/lib/data/presets/car-pool-prompt";

export type PresetComposer = "inline" | "character-swap";

export type CreatePreset = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  model: string;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  cameraMovement: CameraMovement;
  imageSlots: number;
  slotLabels?: string[];
  palette: PosterPalette;
  composer?: PresetComposer;
  lockedPrompt?: boolean;
  overlayTitle?: string;
  tag?: string;
  baseVideoUrl?: string;
  basePosterUrl?: string;
};

const palettes = {
  neonRain: {
    from: "#05080f",
    via: "#1a1430",
    to: "#3a2208",
    accent: "#FBE418",
  },
  analog: {
    from: "#0c0a08",
    via: "#241810",
    to: "#4a3020",
    accent: "#ff9a3c",
  },
  ember: {
    from: "#0c0604",
    via: "#2a1008",
    to: "#6a2410",
    accent: "#ff6a2a",
  },
  void: {
    from: "#020308",
    via: "#0b1230",
    to: "#24104a",
    accent: "#FBE418",
  },
  goldroom: {
    from: "#0c0a04",
    via: "#2a220c",
    to: "#5a4a14",
    accent: "#FBE418",
  },
  blossom: {
    from: "#140810",
    via: "#3a1528",
    to: "#6b2a22",
    accent: "#ffb4c8",
  },
  carpool: {
    from: "#08090c",
    via: "#1a1410",
    to: "#3a2a18",
    accent: "#e8c547",
  },
} as const;

export const CREATE_PRESETS: CreatePreset[] = [
  {
    id: "preset_hotel_lobby",
    title: "Hotel Lobby",
    description: "Swap two people into the orange studio take.",
    prompt: HOTEL_LOBBY_PROMPT,
    model: "seedance",
    aspectRatio: "16:9",
    duration: 15,
    cameraMovement: "static",
    imageSlots: 2,
    slotLabels: ["Person 1", "Person 2"],
    palette: palettes.ember,
    composer: "character-swap",
    lockedPrompt: true,
    tag: "Trending",
    baseVideoUrl:
      "https://customer-168q7c7whaiux5au.cloudflarestream.com/069af4472976ae832c2a21fdfa8f068e/downloads/default.mp4",
    basePosterUrl:
      "https://customer-168q7c7whaiux5au.cloudflarestream.com/069af4472976ae832c2a21fdfa8f068e/thumbnails/thumbnail.jpg",
  },
  {
    id: "preset_car_pool",
    title: "Car Pool",
    description: "Swap five people into the car.",
    prompt: CAR_POOL_PROMPT,
    model: "seedance",
    aspectRatio: "16:9",
    duration: 15,
    cameraMovement: "static",
    imageSlots: 5,
    slotLabels: [
      "Driver",
      "Front passenger",
      "Back left",
      "Back middle",
      "Back right",
    ],
    palette: palettes.carpool,
    composer: "character-swap",
    lockedPrompt: true,
    baseVideoUrl:
      "https://customer-168q7c7whaiux5au.cloudflarestream.com/73bf9ba05b3f4f4b5afbfb3ed1eee9f0/downloads/default.mp4",
    basePosterUrl:
      "https://customer-168q7c7whaiux5au.cloudflarestream.com/73bf9ba05b3f4f4b5afbfb3ed1eee9f0/thumbnails/thumbnail.jpg",
  },
  {
    id: "preset_neon_descent",
    title: "Neon descent",
    description: "Rain, towers, 3am drone.",
    prompt:
      "Cinematic drone shot gliding over a rain-soaked neon city at 3am, steam rising from street vents, anamorphic bokeh, slow descent between glass towers, moody teal and tungsten light.",
    model: "alibaba/wan-3.0",
    aspectRatio: "16:9",
    duration: 10,
    cameraMovement: "crane",
    imageSlots: 2,
    palette: palettes.neonRain,
  },
  {
    id: "preset_sofa",
    title: "Awkward comedy",
    description: "Tight meme, overhead panic.",
    prompt:
      "Live-action meme: a blonde man in a houndstooth suit and striped tie, stuck under a grey sofa, looking up in distress, awkward comedy, tight overhead angle.",
    model: "bytedance/seedance-2.0-fast",
    aspectRatio: "16:9",
    duration: 10,
    cameraMovement: "static",
    imageSlots: 2,
    palette: palettes.analog,
  },
  {
    id: "preset_portrait_flex",
    title: "Vertical flex",
    description: "Phone-frame portrait energy.",
    prompt:
      "Live-action vertical phone video: a man in a black hoodie, gold chain, and glasses on a wet tarmac, palms out in front of a black private jet, overcast flex energy, 9:16.",
    model: "bytedance/seedance-2.0-fast",
    aspectRatio: "9:16",
    duration: 15,
    cameraMovement: "handheld",
    imageSlots: 3,
    palette: palettes.void,
  },
  {
    id: "preset_studio_duet",
    title: "Studio duet",
    description: "Flat backdrop, cursed take.",
    prompt:
      "Live-action studio comedy: two men in dark suits against a flat orange backdrop, a vintage condenser mic between them, one singing with eyes closed, the other conducting, slightly cursed duet energy.",
    model: "bytedance/seedance-2.0-fast",
    aspectRatio: "9:16",
    duration: 15,
    cameraMovement: "static",
    imageSlots: 2,
    palette: palettes.ember,
  },
  {
    id: "preset_gold_room",
    title: "Last dance",
    description: "Analog grain, gold ballroom.",
    prompt:
      "Music video: a singer in a decaying gold ballroom, analog tape warp, flickering practicals, slow push-in, grain like 16mm, a last dance that never ends.",
    model: "alibaba/wan-3.0",
    aspectRatio: "16:9",
    duration: 15,
    cameraMovement: "dolly",
    imageSlots: 1,
    palette: palettes.goldroom,
  },
  {
    id: "preset_blossom",
    title: "Blossom rider",
    description: "Anime dusk, speed lines.",
    prompt:
      "Anime sequence: a lone rider cutting through a cherry-blossom storm at dusk, dramatic speed lines, rich cel shading, wind tearing at a long coat, cinematic widescreen.",
    model: "bytedance/seedance-2.0",
    aspectRatio: "16:9",
    duration: 10,
    cameraMovement: "pan",
    imageSlots: 2,
    palette: palettes.blossom,
  },
];
