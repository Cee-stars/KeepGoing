/* =============================================================
   KeepGoing — 単語データ（17語：単語10 + チャンク7）
   形式は docs/CONTRACT.md の「データ形式」に厳密に従う。
   enMark / jaMark は en / ja に実際に含まれる文字列のみを書く。
   ============================================================= */
window.WORDS = [
  /* ---- 単語（As winter approaches… の文より）------------------------- */
  {
    id: 1,
    term: "approach",
    ipa: "/əˈproʊtʃ/",
    meaning: "近づく",
    examples: [
      {
        en: "Winter is approaching, so I bought a warm coat.",
        ja: "冬が近づいているので、暖かいコートを買った。",
        enMark: ["approaching"],
        jaMark: ["近づいている"]
      },
      {
        en: "The bus is approaching the stop.",
        ja: "バスが停留所に近づいている。",
        enMark: ["approaching"],
        jaMark: ["近づいている"]
      }
    ]
  },
  {
    id: 2,
    term: "daylight",
    ipa: "/ˈdeɪlaɪt/",
    meaning: "日光、昼の明るさ",
    examples: [
      {
        en: "There is not much daylight in December.",
        ja: "12月は昼の明るい時間が多くない。",
        enMark: ["daylight"],
        jaMark: ["昼の明るい時間"]
      },
      {
        en: "The room is bright because of the daylight.",
        ja: "日光のおかげで部屋は明るい。",
        enMark: ["daylight"],
        jaMark: ["日光"]
      }
    ]
  },
  {
    id: 3,
    term: "grow",
    ipa: "/ˈɡroʊ/",
    meaning: "（〜の状態に）なる",
    examples: [
      {
        en: "The sky grew dark, so we went home.",
        ja: "空が暗くなったので、私たちは家に帰った。",
        enMark: ["grew"],
        jaMark: ["暗くなった"]
      },
      {
        en: "The noise grew louder and louder.",
        ja: "その音はどんどん大きくなった。",
        enMark: ["grew"],
        jaMark: ["大きくなった"]
      }
    ]
  },
  {
    id: 4,
    term: "shorter",
    ipa: "/ˈʃɔːrtər/",
    meaning: "より短い（short の比較級）",
    examples: [
      {
        en: "In winter, the days are shorter than in summer.",
        ja: "冬は夏より日が短い。",
        enMark: ["shorter"],
        jaMark: ["短い"]
      },
      {
        en: "This way to the station is shorter.",
        ja: "駅へはこの道の方が短い。",
        enMark: ["shorter"],
        jaMark: ["短い"]
      }
    ]
  },
  {
    id: 5,
    term: "prone",
    ipa: "/ˈproʊn/",
    meaning: "（〜に）なりやすい",
    examples: [
      {
        en: "I am prone to headaches when I don’t sleep well.",
        ja: "私はよく眠れないと頭痛になりやすい。",
        enMark: ["prone to"],
        jaMark: ["なりやすい"]
      },
      {
        en: "My little brother is prone to colds in winter.",
        ja: "弟は冬に風邪をひきやすい。",
        enMark: ["prone to"],
        jaMark: ["ひきやすい"]
      }
    ]
  },
  {
    id: 6,
    term: "seasonal",
    ipa: "/ˈsiːzənəl/",
    meaning: "季節の、季節による",
    examples: [
      {
        en: "This shop only sells seasonal fruit.",
        ja: "この店は季節の果物だけを売っている。",
        enMark: ["seasonal"],
        jaMark: ["季節の"]
      },
      {
        en: "He has a seasonal job at a ski hotel.",
        ja: "彼はスキー場のホテルで季節限定の仕事をしている。",
        enMark: ["seasonal"],
        jaMark: ["季節限定"]
      }
    ]
  },
  {
    id: 7,
    term: "depression",
    ipa: "/dɪˈprɛʃən/",
    meaning: "うつ、うつ状態",
    examples: [
      {
        en: "He saw a doctor because of his depression.",
        ja: "彼はうつのために医者に行った。",
        enMark: ["depression"],
        jaMark: ["うつ"]
      },
      {
        en: "Exercise and sunlight can help with depression.",
        ja: "運動と日光はうつに役立つことがある。",
        enMark: ["depression"],
        jaMark: ["うつ"]
      }
    ]
  },
  {
    id: 8,
    term: "feel",
    ipa: "/ˈfiːl/",
    meaning: "感じる",
    examples: [
      {
        en: "I always feel tired on Monday morning.",
        ja: "私は月曜の朝はいつも疲れを感じる。",
        enMark: ["feel"],
        jaMark: ["感じる"]
      },
      {
        en: "It’s going to rain. I can feel it.",
        ja: "雨が降りそうだ。そんな気がする。",
        enMark: ["feel"],
        jaMark: ["気がする"]
      }
    ]
  },
  {
    id: 9,
    term: "body",
    ipa: "/ˈbɑːdi/",
    meaning: "体",
    examples: [
      {
        en: "Cold weather is hard on my body.",
        ja: "寒い天気は私の体にきつい。",
        enMark: ["body"],
        jaMark: ["体"]
      },
      {
        en: "Water is good for your body.",
        ja: "水は体にいい。",
        enMark: ["body"],
        jaMark: ["体"]
      }
    ]
  },
  {
    id: 10,
    term: "brain",
    ipa: "/ˈbreɪn/",
    meaning: "脳",
    examples: [
      {
        en: "Your brain needs sleep to work well.",
        ja: "脳がきちんと働くには睡眠が必要だ。",
        enMark: ["brain"],
        jaMark: ["脳"]
      },
      {
        en: "Breakfast gives your brain energy.",
        ja: "朝食は脳にエネルギーを与える。",
        enMark: ["brain"],
        jaMark: ["脳"]
      }
    ]
  },
  /* ---- チャンク（意味のかたまり）-------------------------------------- */
  {
    id: 11,
    term: "as winter approaches",
    ipa: "/æz ˈwɪntər əˈproʊtʃɪz/",
    meaning: "冬が近づくにつれて",
    examples: [
      {
        en: "As winter approaches, the mornings get colder.",
        ja: "冬が近づくにつれて、朝は寒くなる。",
        enMark: ["As winter approaches"],
        jaMark: ["冬が近づくにつれて"]
      },
      {
        en: "As winter approaches, I want to stay home more.",
        ja: "冬が近づくにつれて、もっと家にいたくなる。",
        enMark: ["As winter approaches"],
        jaMark: ["冬が近づくにつれて"]
      }
    ]
  },
  {
    id: 12,
    term: "daylight hours",
    ipa: "/ˈdeɪlaɪt ˌaʊərz/",
    meaning: "日照時間、昼の明るい時間",
    examples: [
      {
        en: "Daylight hours are very short in January.",
        ja: "1月は日照時間がとても短い。",
        enMark: ["Daylight hours"],
        jaMark: ["日照時間"]
      },
      {
        en: "We have more daylight hours in June.",
        ja: "6月は日照時間がもっと長い。",
        enMark: ["daylight hours"],
        jaMark: ["日照時間"]
      }
    ]
  },
  {
    id: 13,
    term: "grow shorter",
    ipa: "/ˌɡroʊ ˈʃɔːrtər/",
    meaning: "だんだん短くなる",
    examples: [
      {
        en: "The days grow shorter after September.",
        ja: "9月を過ぎると日はだんだん短くなる。",
        enMark: ["grow shorter"],
        jaMark: ["だんだん短くなる"]
      },
      {
        en: "My lunch break grew shorter this year.",
        ja: "今年は昼休みが短くなった。",
        enMark: ["grew shorter"],
        jaMark: ["短くなった"]
      }
    ]
  },
  {
    id: 14,
    term: "people prone to",
    ipa: "/ˈpiːpəl ˈproʊn tə/",
    meaning: "〜になりやすい人",
    examples: [
      {
        en: "People prone to colds should wear a mask.",
        ja: "風邪をひきやすい人はマスクをするべきだ。",
        enMark: ["People prone to"],
        jaMark: ["ひきやすい人"]
      },
      {
        en: "People prone to stress need more rest.",
        ja: "ストレスを感じやすい人はもっと休みが必要だ。",
        enMark: ["People prone to"],
        jaMark: ["感じやすい人"]
      }
    ]
  },
  {
    id: 15,
    term: "seasonal depression",
    ipa: "/ˌsiːzənəl dɪˈprɛʃən/",
    meaning: "季節性のうつ",
    examples: [
      {
        en: "Some people have seasonal depression in winter.",
        ja: "冬に季節性のうつになる人もいる。",
        enMark: ["seasonal depression"],
        jaMark: ["季節性のうつ"]
      },
      {
        en: "A bright lamp can help with seasonal depression.",
        ja: "明るいランプは季節性のうつに役立つことがある。",
        enMark: ["seasonal depression"],
        jaMark: ["季節性のうつ"]
      }
    ]
  },
  {
    id: 16,
    term: "can feel it",
    ipa: "/kən ˈfiːl ɪt/",
    meaning: "それを感じ取ることがある",
    examples: [
      {
        en: "Winter is coming. I can feel it.",
        ja: "冬が来る。それを感じ取れる。",
        enMark: ["can feel it"],
        jaMark: ["感じ取れる"]
      },
      {
        en: "The test was hard, and the students could feel it.",
        ja: "テストは難しくて、生徒たちはそれを感じていた。",
        enMark: ["could feel it"],
        jaMark: ["感じていた"]
      }
    ]
  },
  {
    id: 17,
    term: "in their bodies and brains",
    ipa: "/ɪn ðɛr ˈbɑːdiz ən ˈbreɪnz/",
    meaning: "体と脳で",
    examples: [
      {
        en: "Children learn new things in their bodies and brains.",
        ja: "子どもは体と脳で新しいことを学ぶ。",
        enMark: ["in their bodies and brains"],
        jaMark: ["体と脳で"]
      },
      {
        en: "After the game, the players were tired in their bodies and brains.",
        ja: "試合のあと、選手たちは体と脳が疲れていた。",
        enMark: ["in their bodies and brains"],
        jaMark: ["体と脳"]
      }
    ]
  }
];
