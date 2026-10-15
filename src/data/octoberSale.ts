// October Clearance Sale: the full deal list that the printed sale sheet's QR code (/october-sale) points to.
export interface SaleListItem { name: string; was: string; now: string; off: string }
export interface SaleListSection { icon: string; color: string; title: string; blurb: string; items: SaleListItem[] }

export const OCTOBER_SALE_SECTIONS: SaleListSection[] = [
  {
    "icon": "🎃",
    "color": "#7b2d8e",
    "title": "THC Last Call: Delta 8 & More",
    "blurb": "Delta 8 gummies, wax, vapes and more. Our final run — once these are gone, we can’t restock them.",
    "items": [
      {
        "name": "After Hours THC Lubricant",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Delta 8 THC 15MG Gummies Fruit Variety 1 Count",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "Delta 8 THC 15MG Gummies Fruit Variety 100 Count",
        "was": "$150",
        "now": "$60",
        "off": "60%"
      },
      {
        "name": "THC Chocolate Bar Crispy Crunch",
        "was": "$25",
        "now": "$12",
        "off": "52%"
      },
      {
        "name": "Delta 8 THC 15MG Gummies Fruit Variety 20 Count",
        "was": "$45",
        "now": "$22",
        "off": "51%"
      },
      {
        "name": "Delta 8 THC Gummies 100MG Fruit Variety 10 Count",
        "was": "$40",
        "now": "$20",
        "off": "50%"
      },
      {
        "name": "Delta 8 THC Gummies 100MG Fruit Variety 20 Count",
        "was": "$70",
        "now": "$35",
        "off": "50%"
      },
      {
        "name": "Delta 8 THC Gummies 50MG Fruit Variety 1 Count",
        "was": "$5",
        "now": "$2.50",
        "off": "50%"
      },
      {
        "name": "Delta 8 THC Gummies 50MG Fruit Variety 100 Count",
        "was": "$180",
        "now": "$90",
        "off": "50%"
      },
      {
        "name": "THC Disposable Vape One Gram Sativa Chocolate Thunder",
        "was": "$30",
        "now": "$15",
        "off": "50%"
      },
      {
        "name": "THC Disposable Vape Two Grams Hybrid Grape Goji OG",
        "was": "$50",
        "now": "$25",
        "off": "50%"
      },
      {
        "name": "THC Distillate Syringe Forbidden Fruit",
        "was": "$20",
        "now": "$10",
        "off": "50%"
      },
      {
        "name": "THC Distillate Syringe Granddaddy Purple",
        "was": "$20",
        "now": "$10",
        "off": "50%"
      },
      {
        "name": "THC Infused Lemon Agave 10 Oz",
        "was": "$60",
        "now": "$30",
        "off": "50%"
      },
      {
        "name": "THC Infused Lemon Agave 2OZ",
        "was": "$15",
        "now": "$7.50",
        "off": "50%"
      },
      {
        "name": "Delta 8 THC Wax Three Grams Indica Russian Cream",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "Delta 8 THC Wax Three Grams Sativa Mai Tai",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "Delta 8 THC Wax Three Grams Sativa Sour Diesel",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "Delta 8 THC Wax Three Grams Sativa Tropicana Cookies",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "THC Wax Three Grams Terpene Free",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "Delta 8 THC 15MG Gummies Fruit Variety 10 Count",
        "was": "$25",
        "now": "$15",
        "off": "40%"
      },
      {
        "name": "Delta 8 THC Gummies 100MG Fruit Variety 1 Count",
        "was": "$10",
        "now": "$6",
        "off": "40%"
      },
      {
        "name": "Delta 8 THC Gummies 50MG Fruit Variety 10 Count",
        "was": "$35",
        "now": "$21",
        "off": "40%"
      },
      {
        "name": "Delta 8 THC Gummies 50MG Fruit Variety 20 Count",
        "was": "$55",
        "now": "$33",
        "off": "40%"
      },
      {
        "name": "Delta 8 THC Wax Three Grams Sativa Pineapple Express",
        "was": "$35",
        "now": "$21",
        "off": "40%"
      },
      {
        "name": "Delta 8 THC/CBD/CBG Tincture",
        "was": "$60",
        "now": "$36",
        "off": "40%"
      },
      {
        "name": "THC Chocolate Bar",
        "was": "$25",
        "now": "$15",
        "off": "40%"
      },
      {
        "name": "THC Chocolate Bar Marshmallow",
        "was": "$25",
        "now": "$15",
        "off": "40%"
      },
      {
        "name": "THC Disposable Vape One Gram Sativa Maui Wowie",
        "was": "$30",
        "now": "$18",
        "off": "40%"
      },
      {
        "name": "THC Disposable Vape Two Grams Hybrid Golden Pineapple",
        "was": "$50",
        "now": "$30",
        "off": "40%"
      },
      {
        "name": "THC Distillate Syringe Jack Herer",
        "was": "$20",
        "now": "$12",
        "off": "40%"
      },
      {
        "name": "THC Wax Three Grams Hybrid Rs11",
        "was": "$35",
        "now": "$21",
        "off": "40%"
      },
      {
        "name": "THC Wax Three Grams Indica Forbidden Fruit",
        "was": "$35",
        "now": "$21",
        "off": "40%"
      },
      {
        "name": "THC Wax Three Grams Hybrid Jealousy",
        "was": "$35",
        "now": "$24",
        "off": "31%"
      },
      {
        "name": "THC Chocolate Square 1 Count",
        "was": "$5",
        "now": "$3.50",
        "off": "30%"
      },
      {
        "name": "THC Disposable Vape One Gram Hybrid Cotton Candy",
        "was": "$30",
        "now": "$21",
        "off": "30%"
      },
      {
        "name": "THC Disposable Vape One Gram Indica Watermelon OG",
        "was": "$30",
        "now": "$21",
        "off": "30%"
      },
      {
        "name": "THC Disposable Vape Two Grams Hybrid Cotton Candy",
        "was": "$50",
        "now": "$35",
        "off": "30%"
      },
      {
        "name": "THC Disposable Vape Two Grams Indica Lime Sherbert",
        "was": "$50",
        "now": "$35",
        "off": "30%"
      },
      {
        "name": "THC Disposable Vape Two Grams Sativa Chocolate Thunder",
        "was": "$50",
        "now": "$35",
        "off": "30%"
      },
      {
        "name": "THC Vape Cartridge One Gram Indica Watermelon OG",
        "was": "$30",
        "now": "$21",
        "off": "30%"
      },
      {
        "name": "THC Disposable Vape One Gram Indica Blueberry Cookies",
        "was": "$30",
        "now": "$24",
        "off": "20%"
      },
      {
        "name": "THC Disposable Vape Two Grams Indica Blueberry Cookies",
        "was": "$50",
        "now": "$40",
        "off": "20%"
      },
      {
        "name": "THC Vape Cartridge One Gram Hybrid Super Boof",
        "was": "$30",
        "now": "$24",
        "off": "20%"
      },
      {
        "name": "THC Vape Cartridge One Gram Sativa Strawberry Cough",
        "was": "$30",
        "now": "$24",
        "off": "20%"
      }
    ]
  },
  {
    "icon": "🎃",
    "color": "#5b2d8e",
    "title": "THC Last Call: Delta 9 & THCa",
    "blurb": "Delta 9 edibles, THCa flower and pre-rolls. Final run — grab your favorites now.",
    "items": [
      {
        "name": "Delta 9 THC 10MG Gummies Fruit Variety 20 Count",
        "was": "$45",
        "now": "$21",
        "off": "53%"
      },
      {
        "name": "Delta 9 THC 10MG Gummies Fruit Variety 100 Count",
        "was": "$150",
        "now": "$75",
        "off": "50%"
      },
      {
        "name": "Delta 9 THC 30MG Gummies Fruit Variety 1 Count",
        "was": "$10",
        "now": "$5",
        "off": "50%"
      },
      {
        "name": "Delta 9 THC Tincture",
        "was": "$50",
        "now": "$25",
        "off": "50%"
      },
      {
        "name": "THC Flower Skywalker OG Indica 28 Grams",
        "was": "$160",
        "now": "$80",
        "off": "50%"
      },
      {
        "name": "THC Ground Flower Green Crack Sativa 7 Grams",
        "was": "$30",
        "now": "$15",
        "off": "50%"
      },
      {
        "name": "THC Snow Caps Girl Scout Cookies Hybrid 7 Grams",
        "was": "$70",
        "now": "$35",
        "off": "50%"
      },
      {
        "name": "Delta 9 THC 10MG Gummies Fruit Variety 1 Count",
        "was": "$5",
        "now": "$3",
        "off": "40%"
      },
      {
        "name": "Delta 9 THC 10MG Gummies Fruit Variety 10 Count",
        "was": "$25",
        "now": "$15",
        "off": "40%"
      },
      {
        "name": "Lights Out Delta 9 THC/CBD/CBN 30MG Gummies 10 Count",
        "was": "$25",
        "now": "$15",
        "off": "40%"
      },
      {
        "name": "Lights Out Delta 9 THC/CBD/CBN 30MG Gummies 20 Count",
        "was": "$45",
        "now": "$27",
        "off": "40%"
      },
      {
        "name": "THC Flower Nerds Hybrid 3.5 Grams",
        "was": "$35",
        "now": "$24",
        "off": "31%"
      },
      {
        "name": "Delta 9 THC 30MG Gummies Fruit Variety 5 Count",
        "was": "$30",
        "now": "$21",
        "off": "30%"
      },
      {
        "name": "Delta 9 THC Mini Rice Crispy Treats",
        "was": "$5",
        "now": "$3.50",
        "off": "30%"
      },
      {
        "name": "THC Flower Green Crack Sativa 28 Grams",
        "was": "$160",
        "now": "$112",
        "off": "30%"
      },
      {
        "name": "THC Pre Rolled Joint Hybrid Lemon Cherry Gelato",
        "was": "$12.50",
        "now": "$10",
        "off": "20%"
      }
    ]
  },
  {
    "icon": "🌿",
    "color": "#2f8f4a",
    "title": "Flower & Pre-Rolls",
    "blurb": "CBD and CBG flower, smalls and joints.",
    "items": [
      {
        "name": "CBG Flower Super G Sativa 1 Gram",
        "was": "$8",
        "now": "$3",
        "off": "62%"
      },
      {
        "name": "CBG/CBD Pre Rolled Joint Gelato Hybrid 1.5 Grams",
        "was": "$10",
        "now": "$4",
        "off": "60%"
      },
      {
        "name": "CBG Flower Super G Shake Sativa 1 Gram",
        "was": "$4",
        "now": "$2",
        "off": "50%"
      },
      {
        "name": "CBG Flower Super G Sativa 3.5 Grams",
        "was": "$20",
        "now": "$12",
        "off": "40%"
      }
    ]
  },
  {
    "icon": "💨",
    "color": "#1f7a8c",
    "title": "Vapes & Carts",
    "blurb": "Cartridges and disposables.",
    "items": [
      {
        "name": "CBD Vape Cartridge One Gram Hybrid Grapefruit Romulan",
        "was": "$20",
        "now": "$10",
        "off": "50%"
      },
      {
        "name": "CBD Vape Cartridge One Gram Hybrid Twisted Citrus",
        "was": "$20",
        "now": "$10",
        "off": "50%"
      },
      {
        "name": "CBD Vape Cartridge One Gram Indica King Louis XIII",
        "was": "$20",
        "now": "$12",
        "off": "40%"
      },
      {
        "name": "CBD Vape Cartridge One Gram Sativa Super Sour Diesel",
        "was": "$20",
        "now": "$12",
        "off": "40%"
      },
      {
        "name": "CBD Vape Cartridge One Gram Sativa Tropicana Cookies",
        "was": "$20",
        "now": "$12",
        "off": "40%"
      },
      {
        "name": "CBD Vape Cartridge One Gram Sativa Maui Wowie",
        "was": "$20",
        "now": "$15",
        "off": "25%"
      }
    ]
  },
  {
    "icon": "💧",
    "color": "#b8860b",
    "title": "Concentrates, Wax & Rosin",
    "blurb": "Wax, rosin and isolate.",
    "items": [
      {
        "name": "CBD/CBG/CBN Wax Two Grams Cereal Milk",
        "was": "$25",
        "now": "$7.50",
        "off": "70%"
      },
      {
        "name": "CBD Full Spectrum Wax Two Grams Bubba Kush",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "CBD Full Spectrum Wax Two Grams Ecto Cooler",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "CBD Full Spectrum Wax Two Grams Forbidden",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "CBD Full Spectrum Wax Two Grams Mai Tai",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "CBD Full Spectrum Wax Two Grams Runtz",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "CBD Isolate One Gram",
        "was": "$10",
        "now": "$4",
        "off": "60%"
      },
      {
        "name": "CBD Rosin One Gram Hybrid Mai Tai",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "CBD Rosin One Gram Hybrid Runtz",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "CBD Rosin One Gram Sativa Blue Dream",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "CBD Rosin One Gram Sativa Ecto Cooler",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "CBD/CBG/CBN Wax Two Grams Blue Widow",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "CBD/CBG/CBN Wax Two Grams Unicorn Piss",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "CBG Isolate One Gram",
        "was": "$10",
        "now": "$4",
        "off": "60%"
      },
      {
        "name": "CBN Isolate One Gram",
        "was": "$10",
        "now": "$4",
        "off": "60%"
      },
      {
        "name": "CBD Rosin One Gram Indica Forbidden Fruit",
        "was": "$5",
        "now": "$2.50",
        "off": "50%"
      }
    ]
  },
  {
    "icon": "🍩",
    "color": "#c0392b",
    "title": "Edibles & Drinks",
    "blurb": "Gummies, capsules, syrups, drinks and treats. Start low, go slow.",
    "items": [
      {
        "name": "CBD/CBG Gummies Fruit Variety 1 Count",
        "was": "$5",
        "now": "$1.50",
        "off": "70%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 150MG Watermelon 1 Count",
        "was": "$10",
        "now": "$3",
        "off": "70%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 150MG Mango 1 Count",
        "was": "$8",
        "now": "$3",
        "off": "62%"
      },
      {
        "name": "CBD Full Spectrum Gel Capsules 25MG",
        "was": "$60",
        "now": "$25",
        "off": "58%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 30MG Fruit Variety 1 Count",
        "was": "$5",
        "now": "$2.50",
        "off": "50%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 30MG Fruit Variety 100 Count",
        "was": "$100",
        "now": "$50",
        "off": "50%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 150MG Mango 20 Count",
        "was": "$60",
        "now": "$34",
        "off": "43%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 150MG Watermelon 20 Count",
        "was": "$60",
        "now": "$34",
        "off": "43%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 30MG Fruit Variety 20 Count",
        "was": "$25",
        "now": "$15",
        "off": "40%"
      },
      {
        "name": "CBD Syrup Coffee Nano Infused 8OZ",
        "was": "$20",
        "now": "$15",
        "off": "25%"
      },
      {
        "name": "CBD/CBG Gummies Fruit Variety 10 Count",
        "was": "$10",
        "now": "$7.50",
        "off": "25%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 150MG Mango 5 Count",
        "was": "$25",
        "now": "$19",
        "off": "24%"
      },
      {
        "name": "CBD/CBG/CBN Gummies 150MG Watermelon 5 Count",
        "was": "$25",
        "now": "$19",
        "off": "24%"
      }
    ]
  },
  {
    "icon": "🧪",
    "color": "#6c4f9c",
    "title": "Tinctures",
    "blurb": "CBD, CBG, CBN and THCV drops.",
    "items": [
      {
        "name": "CBG Isolate Tincture",
        "was": "$50",
        "now": "$15",
        "off": "70%"
      },
      {
        "name": "CBN Isolate Tincture",
        "was": "$50",
        "now": "$15",
        "off": "70%"
      },
      {
        "name": "CBD/CBG/THCV Tincture",
        "was": "$60",
        "now": "$19",
        "off": "68%"
      },
      {
        "name": "CBD/CBC/CBG/CBN/CBT Five Star Tincture",
        "was": "$50",
        "now": "$20",
        "off": "60%"
      },
      {
        "name": "CBD Isolate Tincture",
        "was": "$50",
        "now": "$35",
        "off": "30%"
      }
    ]
  },
  {
    "icon": "🧴",
    "color": "#d35400",
    "title": "Topicals & Body Care",
    "blurb": "Creams, gels, balms, oils and lubricants.",
    "items": [
      {
        "name": "CBD Muscle & Joint Relief Cream 1000MG",
        "was": "$50",
        "now": "$15",
        "off": "70%"
      },
      {
        "name": "Euphoria Multi Blend Lubricant",
        "was": "$20",
        "now": "$6",
        "off": "70%"
      },
      {
        "name": "After Hours CBD/CBG/CBN Lubricant",
        "was": "$10",
        "now": "$4",
        "off": "60%"
      },
      {
        "name": "CBD Muscle & Joint Relief Cream 500MG",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "CBD Muscle & Joint Relief Gel 1000MG",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "CBD/CBG Beard Oil",
        "was": "$10",
        "now": "$4",
        "off": "60%"
      },
      {
        "name": "CBD/CBG/CBN Lubricant Temptation",
        "was": "$10",
        "now": "$4",
        "off": "60%"
      },
      {
        "name": "CBG Hemp Lavender All Purpose Cleaner",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "CBG Hemp Peppermint All-purpose Cleaner",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "Hemp Body Butter",
        "was": "$30",
        "now": "$12",
        "off": "60%"
      },
      {
        "name": "Hemp Hair Oil",
        "was": "$30",
        "now": "$12",
        "off": "60%"
      },
      {
        "name": "CBD Muscle Rub",
        "was": "$35",
        "now": "$16",
        "off": "54%"
      },
      {
        "name": "CBD/CBG/CBN Muscle Gel 3,000mg",
        "was": "$45",
        "now": "$21",
        "off": "53%"
      }
    ]
  },
  {
    "icon": "🔥",
    "color": "#34495e",
    "title": "Accessories & Glass",
    "blurb": "Papers, wraps, batteries, glass and gear.",
    "items": [
      {
        "name": "Ooze Slim Twist Battery Rainbow",
        "was": "$18",
        "now": "$5",
        "off": "72%"
      },
      {
        "name": "THD Slim Twist Battery Blue",
        "was": "$18",
        "now": "$5",
        "off": "72%"
      },
      {
        "name": "THD Slim Twist Battery Gold",
        "was": "$18",
        "now": "$5",
        "off": "72%"
      },
      {
        "name": "THD Slim Twist Battery Purple",
        "was": "$18",
        "now": "$5",
        "off": "72%"
      },
      {
        "name": "The Hemp Dispensary Rolling Tray",
        "was": "$10",
        "now": "$3",
        "off": "70%"
      },
      {
        "name": "Stache Glass - Carb Cap",
        "was": "$36",
        "now": "$12",
        "off": "67%"
      },
      {
        "name": "Ooze Nectar Connectars - Black",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Ooze Nectar Connectars - Blue",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Ooze Nectar Connectars - Green",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Ooze Nectar Connectars - Purple",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Ooze Nectar Connectars - Red",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Ooze Slim Charger",
        "was": "$5",
        "now": "$2",
        "off": "60%"
      },
      {
        "name": "Rig in One - Replacement Glass Body Blue",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "Rig in One - Replacement Glass Body Clear",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "Rig in One - Replacement Glass Body Frosted Green",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "Rig in One - Replacement Glass Body Frosted Smoke",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "Rig in One - Replacement Glass Body Green",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "Rig in One - Replacement Glass Body Smoke",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "Rig in One - Replacement Glass Body Teal",
        "was": "$40",
        "now": "$16",
        "off": "60%"
      },
      {
        "name": "Stache Nectar Connectars Blue",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Stache Nectar Connectars Green",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Stache Nectar Connectars Red",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "Terpene Enhanced Hemp Wraps 2 Pack Grape Soda",
        "was": "$2.50",
        "now": "$1",
        "off": "60%"
      },
      {
        "name": "Ooze Saturn Grinder Chrome",
        "was": "$25",
        "now": "$11",
        "off": "56%"
      },
      {
        "name": "Ooze Saturn Grinder Green/Purple",
        "was": "$25",
        "now": "$11",
        "off": "56%"
      },
      {
        "name": "LED Light Up Jar",
        "was": "$25",
        "now": "$12",
        "off": "52%"
      },
      {
        "name": "Rig in One - Replacement Torch",
        "was": "$45",
        "now": "$22",
        "off": "51%"
      },
      {
        "name": "Glob Mops XL 300 Count",
        "was": "$15",
        "now": "$7.50",
        "off": "50%"
      },
      {
        "name": "Hemp Rolling Papers (Pure Hemp) 1 1/4 Regular",
        "was": "$2",
        "now": "$1",
        "off": "50%"
      },
      {
        "name": "Hemp Rolling Papers (Pure Hemp) King Size Raw",
        "was": "$2",
        "now": "$1",
        "off": "50%"
      },
      {
        "name": "Hemp Rolling Papers (Pure Hemp) King Size Regular",
        "was": "$2",
        "now": "$1",
        "off": "50%"
      },
      {
        "name": "Ooze - Full Quartz Bubble Carb Cap",
        "was": "$10",
        "now": "$5",
        "off": "50%"
      },
      {
        "name": "Randy's Hempwick 4ft",
        "was": "$2",
        "now": "$1",
        "off": "50%"
      },
      {
        "name": "Rig in One - Pink Mix",
        "was": "$150",
        "now": "$75",
        "off": "50%"
      },
      {
        "name": "Rig in One - Purple",
        "was": "$150",
        "now": "$75",
        "off": "50%"
      },
      {
        "name": "Rig in One - Purple Mix",
        "was": "$150",
        "now": "$75",
        "off": "50%"
      },
      {
        "name": "Rig in One - Teal",
        "was": "$150",
        "now": "$75",
        "off": "50%"
      },
      {
        "name": "Stache Glass - Bubble Carb Cap",
        "was": "$36",
        "now": "$18",
        "off": "50%"
      },
      {
        "name": "White Rhino Glass - 6mm Directional Carb Cap",
        "was": "$10",
        "now": "$5",
        "off": "50%"
      },
      {
        "name": "11x Premium Refined Butane Neon 300ML",
        "was": "$10",
        "now": "$6",
        "off": "40%"
      },
      {
        "name": "SP Quartz - Round Banger 14 Mm",
        "was": "$20",
        "now": "$12",
        "off": "40%"
      },
      {
        "name": "Terpene Enhanced Hemp Wraps 2 Pack Blackberry Jam",
        "was": "$2.50",
        "now": "$1.50",
        "off": "40%"
      },
      {
        "name": "Terpene Enhanced Hemp Wraps 2 Pack Papaya Punch",
        "was": "$2.50",
        "now": "$1.50",
        "off": "40%"
      }
    ]
  },
  {
    "icon": "👕",
    "color": "#1f6b3a",
    "title": "Apparel & Merch",
    "blurb": "Rep the shop for less.",
    "items": [
      {
        "name": "The Hemp Dispensary Metal Sign Black Background",
        "was": "$15",
        "now": "$5.50",
        "off": "63%"
      },
      {
        "name": "The Hemp Dispensary Metal Sign Patterened Background",
        "was": "$15",
        "now": "$5.50",
        "off": "63%"
      },
      {
        "name": "The Hemp Dispensary Drip Logo Gray T-shirt Small",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "The Hemp Dispensary Drip Logo White T-shirt Medium",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "The Hemp Dispensary Drip Logo White T-shirt Small",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "The Hemp Dispensary Drip Logo White T-shirt XL",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "The Hemp Dispensary Drip Logo White T-shirt XXL",
        "was": "$20",
        "now": "$8",
        "off": "60%"
      },
      {
        "name": "The Hemp Dispensary Hover T-shirt 2XL",
        "was": "$25",
        "now": "$12",
        "off": "52%"
      },
      {
        "name": "The Hemp Dispensary Hover T-shirt Medium",
        "was": "$25",
        "now": "$12",
        "off": "52%"
      },
      {
        "name": "The Hemp Dispensary Hover T-shirt Small",
        "was": "$25",
        "now": "$12",
        "off": "52%"
      },
      {
        "name": "Framed Hemp Poster",
        "was": "$15",
        "now": "$7.50",
        "off": "50%"
      },
      {
        "name": "The Hemp Dispensary Black T-shirt Logo Small",
        "was": "$20",
        "now": "$10",
        "off": "50%"
      },
      {
        "name": "The Hemp Dispensary Hoodie Large",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "The Hemp Dispensary Hoodie Medium",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "The Hemp Dispensary Hoodie Small",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "The Hemp Dispensary Hoodie X-large",
        "was": "$35",
        "now": "$18",
        "off": "49%"
      },
      {
        "name": "Canvas Hemp Poster",
        "was": "$25",
        "now": "$15",
        "off": "40%"
      }
    ]
  },
  {
    "icon": "🐶",
    "color": "#8e6e53",
    "title": "Pet Treats",
    "blurb": "CBD treats for the four-legged crew.",
    "items": [
      {
        "name": "Grain Free CBD Pet Treats Cheddar Bones",
        "was": "$35",
        "now": "$20",
        "off": "43%"
      },
      {
        "name": "Grain Free CBD Pet Treats Salmon",
        "was": "$35",
        "now": "$20",
        "off": "43%"
      },
      {
        "name": "Grain Free CBD Pet Treats Peanut Butter",
        "was": "$35",
        "now": "$26",
        "off": "26%"
      }
    ]
  }
];
