const locations = [
    // DIFFICULTY 1
    {
        id: 1,
        name: "Land's End",
        category: "Headland",
        difficulty: 1,
        lat: 50.06861,
        lon: -5.71612,
        tolerance: 0.5,
        fact: "Land's End is the most westerly point of mainland England.",
        verified: true
    },
    {
        id: 2,
        name: "St Ives",
        category: "Town",
        difficulty: 1,
        lat: 50.21053,
        lon: -5.48008,
        tolerance: 0.75,
        fact: "St Ives developed from a fishing port and became famous for its community of artists.",
        verified: true
    },

    // DIFFICULTY 2
    {
        id: 3,
        name: "Newquay",
        category: "Town",
        difficulty: 2,
        lat: 50.41264,
        lon: -5.07676,
        tolerance: 0.75,
        fact: "Newquay is one of Cornwall's best-known surfing towns.",
        verified: true
    },
    {
        id: 4,
        name: "St Michael's Mount",
        category: "Tidal Island",
        difficulty: 2,
        lat: 50.11611,
        lon: -5.47882,
        tolerance: 0.4,
        fact: "A granite causeway connects the island to Marazion when the tide allows.",
        verified: true
    },

    // DIFFICULTY 3
    {
        id: 5,
        name: "Lizard Point",
        category: "Headland",
        difficulty: 3,
        lat: 49.95992,
        lon: -5.20615,
        tolerance: 0.45,
        fact: "Lizard Point is the southernmost point of mainland Great Britain.",
        verified: true
    },
    {
        id: 6,
        name: "Eden Project",
        category: "Attraction",
        difficulty: 3,
        lat: 50.36195,
        lon: -4.74470,
        tolerance: 0.45,
        fact: "The Eden Project's giant biomes were built in a former china-clay pit.",
        verified: true
    },

    // DIFFICULTY 4
    {
        id: 7,
        name: "Tintagel Castle",
        category: "Castle",
        difficulty: 4,
        lat: 50.66726,
        lon: -4.75859,
        tolerance: 0.35,
        fact: "The castle ruins have been associated with the legends of King Arthur for centuries.",
        verified: true
    },
    {
        id: 8,
        name: "Port Isaac Harbour",
        category: "Harbour",
        difficulty: 4,
        lat: 50.592913,
        lon: -4.833107,
        tolerance: 0.4,
        fact: "Port Isaac's narrow streets and harbour have appeared in numerous television productions.",
        verified: true
    },

    // DIFFICULTY 5
    {
        id: 9,
        name: "Kynance Cove",
        category: "Cove",
        difficulty: 5,
        lat: 49.97455,
        lon: -5.23030,
        tolerance: 0.35,
        fact: "Kynance Cove is known for its turquoise water and serpentine rock formations.",
        verified: true
    },
    {
        id: 10,
        name: "Minack Theatre",
        category: "Landmark",
        difficulty: 5,
        lat: 50.04118,
        lon: -5.65105,
        tolerance: 0.25,
        fact: "The open-air theatre was created by Rowena Cade above the cliffs at Porthcurno.",
        verified: true
    },

    // DIFFICULTY 6
    {
        id: 11,
        name: "Charlestown Harbour",
        category: "Harbour",
        difficulty: 6,
        lat: 50.33288,
        lon: -4.75863,
        tolerance: 0.35,
        fact: "Charlestown's Georgian harbour was built to support Cornwall's copper and china-clay industries.",
        verified: true
    },
    {
        id: 12,
        name: "Boscastle Harbour",
        category: "Harbour",
        difficulty: 6,
        lat: 50.69036,
        lon: -4.69337,
        tolerance: 0.35,
        fact: "Boscastle's harbour lies at the end of a long, narrow natural inlet.",
        verified: true
    },

    // DIFFICULTY 7
    {
        id: 13,
        name: "Rame Head",
        category: "Headland",
        difficulty: 7,
        lat: 50.31672,
        lon: -4.22075,
        tolerance: 0.4,
        fact: "A medieval chapel stands on the prominent headland overlooking Plymouth Sound.",
        verified: true
    },
    {
        id: 14,
        name: "Trevose Head Lighthouse",
        category: "Lighthouse",
        difficulty: 7,
        lat: 50.549402,
        lon: -5.034583,
        tolerance: 0.3,
        fact: "The lighthouse marks the headland between Constantine Bay and Mother Ivey's Bay.",
        verified: true
    },

    // DIFFICULTY 8
    {
    id: 15,
    name: "Rough Tor",
    category: "Natural Feature",
    difficulty: 8,
    lat: 50.59735168328703,
    lon: -4.621754997497021,
    tolerance: 0.35,
    fact: "Rough Tor is Cornwall's second-highest summit and contains extensive prehistoric remains.",
    verified: true
},
    {
        id: 16,
        name: "Brown Willy",
        category: "Natural Feature",
        difficulty: 7,
        lat: 50.590717,
        lon: -4.602256,
        tolerance: 0.35,
        fact: "At 420 metres, Brown Willy is the highest point in Cornwall.",
        verified: true
    },

    // DIFFICULTY 9
    {
        id: 17,
        name: "Mên-an-Tol",
        category: "Prehistoric Monument",
        difficulty: 9,
        lat: 50.158527,
        lon: -5.604524,
        tolerance: 0.25,
        fact: "The monument's Cornish name means 'the holed stone'.",
        verified: true
    },
    {
    id: 18,
    name: "Carn Brea Castle",
    category: "Historic Building",
    difficulty: 9,
    lat: 50.22252116404912,
    lon: -5.244724226645356,
    tolerance: 0.3,
    fact: "The castle sits among the granite outcrops near the summit of Carn Brea.",
    verified: true
},

    // DIFFICULTY 10
    {
        id: 19,
        name: "St Anthony Head Lighthouse",
        category: "Lighthouse",
        difficulty: 6,
        lat: 50.141313,
        lon: -5.015565,
        tolerance: 0.25,
        fact: "The lighthouse guards the eastern side of the entrance to Carrick Roads.",
        verified: true
    },
    {
        id: 20,
        name: "Lanyon Quoit",
        category: "Prehistoric Monument",
        difficulty: 10,
        lat: 50.147419,
        lon: -5.598915,
        tolerance: 0.25,
        fact: "Lanyon Quoit is a prehistoric chambered tomb with a huge granite capstone.",
        verified: true
    },

        // --------------------------------------------------
    // GOLD 50 EXTENSION
    // Three additional locations for each difficulty
    // --------------------------------------------------


    // DIFFICULTY 1

    {
        id: 21,
        name: "Padstow Harbour",
        category: "Harbour",
        difficulty: 1,
        lat: 50.541594,
        lon: -4.937630,
        tolerance: 0.45,
        fact: "Padstow stands on the western side of the Camel Estuary and has a long fishing tradition.",
        verified: true
    },

    {
        id: 22,
        name: "Falmouth Harbour",
        category: "Harbour",
        difficulty: 1,
        lat: 50.15440,
        lon: -5.06490,
        tolerance: 0.65,
        fact: "Falmouth grew around one of the world's deepest natural harbours.",
        verified: true
    },

    {
        id: 23,
        name: "Penzance Harbour",
        category: "Harbour",
        difficulty: 1,
        lat: 50.118403,
        lon: -5.531071,
        tolerance: 0.65,
        fact: "Penzance overlooks Mount's Bay and is the western terminus of the Cornish Main Line.",
        verified: true
    },


    // DIFFICULTY 2

    {
        id: 24,
        name: "Bude Sea Pool",
        category: "Landmark",
        difficulty: 2,
        lat: 50.832620,
        lon: -4.554059,
        tolerance: 0.35,
        fact: "Bude Sea Pool is a semi-natural tidal swimming pool beneath the cliffs at Summerleaze Beach.",
        verified: true
    },

    {
        id: 25,
        name: "Looe Harbour",
        category: "Harbour",
        difficulty: 2,
        lat: 50.35370,
        lon: -4.45420,
        tolerance: 0.45,
        fact: "East and West Looe stand on opposite sides of the River Looe.",
        verified: true
    },

    {
        id: 26,
        name: "Truro Cathedral",
        category: "Historic Building",
        difficulty: 2,
        lat: 50.264142,
        lon: -5.051244,
        tolerance: 0.35,
        fact: "Truro Cathedral has three spires and was completed during the late nineteenth and early twentieth centuries.",
        verified: true
    },


    // DIFFICULTY 3

    {
        id: 27,
        name: "Fowey Harbour",
        category: "Harbour",
        difficulty: 3,
        lat: 50.33430,
        lon: -4.63590,
        tolerance: 0.4,
        fact: "Fowey developed around the deep natural harbour at the mouth of the River Fowey.",
        verified: true
    },

    {
        id: 28,
        name: "Perranporth Beach",
        category: "Beach",
        difficulty: 3,
        lat: 50.349542,
        lon: -5.159260,
        tolerance: 0.55,
        fact: "Perranporth Beach stretches for several kilometres along Cornwall's north coast.",
        verified: true
    },

    {
        id: 29,
        name: "Pendennis Castle",
        category: "Castle",
        difficulty: 3,
        lat: 50.146261,
        lon: -5.046244,
        tolerance: 0.35,
        fact: "Pendennis Castle was built by Henry VIII to defend the entrance to Carrick Roads.",
        verified: true
    },


    // DIFFICULTY 4

    {
        id: 30,
        name: "Mousehole Harbour",
        category: "Harbour",
        difficulty: 4,
        lat: 50.082966,
        lon: -5.537929,
        tolerance: 0.35,
        fact: "Mousehole is a historic fishing village on the western side of Mount's Bay.",
        verified: true
    },

    {
        id: 31,
        name: "Polperro Harbour",
        category: "Harbour",
        difficulty: 4,
        lat: 50.331374,
        lon: -4.517216,
        tolerance: 0.35,
        fact: "Polperro's tightly packed cottages surround a small fishing harbour at the mouth of the River Pol.",
        verified: true
    },

    {
        id: 32,
        name: "Mevagissey Harbour",
        category: "Harbour",
        difficulty: 4,
        lat: 50.26960,
        lon: -4.78600,
        tolerance: 0.4,
        fact: "Mevagissey's inner and outer harbours support both fishing boats and pleasure craft.",
        verified: true
    },


    // DIFFICULTY 5

    {
        id: 33,
        name: "Sennen Cove",
        category: "Cove",
        difficulty: 5,
        lat: 50.080022,
        lon: -5.696658,
        tolerance: 0.4,
        fact: "Sennen Cove lies close to Land's End and is known for its broad surfing beach.",
        verified: true
    },

    {
        id: 34,
        name: "Porthcurno Beach",
        category: "Beach",
        difficulty: 5,
        lat: 50.043128,
        lon: -5.650036,
        tolerance: 0.35,
        fact: "Porthcurno was once an important landing point for international submarine telegraph cables.",
        verified: true
    },

    {
        id: 35,
        name: "Bedruthan Steps",
        category: "Natural Feature",
        difficulty: 5,
        lat: 50.484473,
        lon: -5.033760,
        tolerance: 0.45,
        fact: "Bedruthan Steps is known for its dramatic line of offshore sea stacks.",
        verified: true
    },


    // DIFFICULTY 6

    {
        id: 36,
        name: "Wheal Coates",
        category: "Historic Building",
        difficulty: 7,
        lat: 50.305452,
        lon: -5.231650,
        tolerance: 0.3,
        fact: "The Towanroath engine house at Wheal Coates stands dramatically above the north Cornish coast.",
        verified: true
    },

    {
        id: 37,
        name: "Geevor Tin Mine",
        category: "Historic Building",
        difficulty: 7,
        lat: 50.152376,
        lon: -5.675441,
        tolerance: 0.35,
        fact: "Geevor was one of the last working tin mines in Cornwall before closing in 1990.",
        verified: true
    },

    {
        id: 38,
        name: "Levant Mine",
        category: "Historic Building",
        difficulty: 7,
        lat: 50.152473,
        lon: -5.684176,
        tolerance: 0.3,
        fact: "Levant Mine is home to a restored nineteenth-century beam engine.",
        verified: true
    },


    // DIFFICULTY 7

    {
        id: 39,
        name: "Godrevy Lighthouse",
        category: "Lighthouse",
        difficulty: 5,
        lat: 50.242433,
        lon: -5.399948,
        tolerance: 0.3,
        fact: "Godrevy Lighthouse stands on an island near the eastern side of St Ives Bay.",
        verified: true
    },

    {
        id: 40,
        name: "St Mawes Castle",
        category: "Castle",
        difficulty: 5,
        lat: 50.155544,
        lon: -5.023619,
        tolerance: 0.3,
        fact: "St Mawes Castle was built to work with Pendennis Castle in defending Carrick Roads.",
        verified: true
    },

    {
        id: 41,
        name: "Restormel Castle",
        category: "Castle",
        difficulty: 5,
        lat: 50.421900,
        lon: -4.670337,
        tolerance: 0.3,
        fact: "Restormel Castle is notable for its unusually circular layout.",
        verified: true
    },


    // DIFFICULTY 8

    {
        id: 42,
        name: "The Cheesewring",
        category: "Natural Feature",
        difficulty: 8,
        lat: 50.525403,
        lon: -4.459114,
        tolerance: 0.3,
        fact: "The Cheesewring is a naturally formed stack of granite slabs on Bodmin Moor.",
        verified: true
    },

    {
        id: 43,
        name: "Golitha Falls",
        category: "Natural Feature",
        difficulty: 8,
        lat: 50.489742,
        lon: -4.503691,
        tolerance: 0.4,
        fact: "At Golitha Falls, the River Fowey tumbles through a wooded valley over a series of cascades.",
        verified: true
    },

    {
        id: 44,
        name: "Dozmary Pool",
        category: "Natural Feature",
        difficulty: 8,
        lat: 50.542343,
        lon: -4.549611,
        tolerance: 0.4,
        fact: "Dozmary Pool is traditionally associated with the Arthurian legend of Excalibur.",
        verified: true
    },


    // DIFFICULTY 9

    {
        id: 45,
        name: "Trethevy Quoit",
        category: "Prehistoric Monument",
        difficulty: 9,
        lat: 50.493215,
        lon: -4.455479,
        tolerance: 0.25,
        fact: "Trethevy Quoit is a large Neolithic chambered tomb supported by upright stones.",
        verified: true
    },

    {
        id: 46,
        name: "King Doniert's Stone",
        category: "Prehistoric Monument",
        difficulty: 10,
        lat: 50.492921,
        lon: -4.487748,
        tolerance: 0.25,
        fact: "The monument includes an inscribed stone linked to the ninth-century Cornish king Dungarth.",
        verified: true
    },

    {
        id: 47,
        name: "Dupath Well",
        category: "Historic Building",
        difficulty: 10,
        lat: 50.500180,
        lon: -4.292663,
        tolerance: 0.25,
        fact: "Dupath Well is enclosed by a medieval granite well house.",
        verified: true
    },


    // DIFFICULTY 10

    {
        id: 48,
        name: "The Hurlers",
        category: "Prehistoric Monument",
        difficulty: 8,
        lat: 50.516629,
        lon: -4.457947,
        tolerance: 0.3,
        fact: "The Hurlers consists of three prehistoric stone circles arranged in a line.",
        verified: true
    },

    {
        id: 49,
        name: "St Piran's Oratory",
        category: "Historic Building",
        difficulty: 10,
        lat: 50.365024,
        lon: -5.138931,
        tolerance: 0.25,
        fact: "The buried oratory is traditionally associated with Saint Piran, Cornwall's patron saint.",
        verified: true
    },

    {
        id: 50,
        name: "Chûn Quoit",
        category: "Prehistoric Monument",
        difficulty: 10,
        lat: 50.148635,
        lon: -5.637494,
        tolerance: 0.25,
        fact: "Chûn Quoit is one of Cornwall's best-preserved Neolithic chambered tombs.",
        verified: true
    }
];