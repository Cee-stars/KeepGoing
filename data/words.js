/* =============================================================
   KeepGoing — 単語データ（30語：2つの文の単語とチャンク＋構文）
   形式は docs/CONTRACT.md の「データ形式」に厳密に従う。
   enMark / jaMark は en / ja に実際に含まれる文字列のみを書く。
   ============================================================= */
window.WORDS = [
  /* ---- 単語（As winter approaches… の文より）------------------------ */
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

  /* ---- チャンク（As winter approaches… の文より）--------------------- */
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
  },

  /* ---- 単語（The millions of people typically have… の文より）-------- */
  {
    id: 18,
    term: "typically",
    ipa: "/ˈtɪpɪkli/",
    meaning: "たいてい、普通は",
    examples: [
      {
        en: "I typically get up at seven.",
        ja: "私はたいてい7時に起きる。",
        enMark: ["typically"],
        jaMark: ["たいてい"]
      },
      {
        en: "Summer here is typically hot and wet.",
        ja: "ここの夏はたいてい暑くて雨が多い。",
        enMark: ["typically"],
        jaMark: ["たいてい"]
      }
    ]
  },
  {
    id: 19,
    term: "episode",
    ipa: "/ˈɛpɪsoʊd/",
    meaning: "（症状が続く）期間、ひと続きの話",
    examples: [
      {
        en: "He had an episode of back pain last week.",
        ja: "彼は先週、背中が痛む時期があった。",
        enMark: ["episode"],
        jaMark: ["時期"]
      },
      {
        en: "I watched the last episode of the show.",
        ja: "その番組の最終話を見た。",
        enMark: ["episode"],
        jaMark: ["話"]
      }
    ]
  },
  {
    id: 20,
    term: "begin",
    ipa: "/bɪˈɡɪn/",
    meaning: "始まる、始める",
    examples: [
      {
        en: "The movie begins at eight.",
        ja: "映画は8時に始まる。",
        enMark: ["begins"],
        jaMark: ["始まる"]
      },
      {
        en: "School begins in April in Japan.",
        ja: "日本では学校は4月に始まる。",
        enMark: ["begins"],
        jaMark: ["始まる"]
      }
    ]
  },
  {
    id: 21,
    term: "ease",
    ipa: "/ˈiːz/",
    meaning: "和らぐ、楽になる",
    examples: [
      {
        en: "The pain eased after I took the medicine.",
        ja: "薬を飲んだあと、痛みが和らいだ。",
        enMark: ["eased"],
        jaMark: ["和らいだ"]
      },
      {
        en: "The rain eased in the afternoon.",
        ja: "午後になって雨が弱まった。",
        enMark: ["eased"],
        jaMark: ["弱まった"]
      }
    ]
  },

  /* ---- チャンク（The millions of people typically have… の文より）---- */
  {
    id: 22,
    term: "the millions of people",
    ipa: "/ðə ˈmɪljənz əv ˈpiːpəl/",
    meaning: "何百万もの人々（S）",
    examples: [
      {
        en: "The millions of people in this city use the train every day.",
        ja: "この街の何百万もの人々は毎日電車を使う。",
        enMark: ["The millions of people"],
        jaMark: ["何百万もの人々"]
      },
      {
        en: "The millions of people at home watched the news.",
        ja: "家にいる何百万もの人々がそのニュースを見た。",
        enMark: ["The millions of people"],
        jaMark: ["何百万もの人々"]
      }
    ]
  },
  {
    id: 23,
    term: "typically have",
    ipa: "/ˈtɪpɪkli ˈhæv/",
    meaning: "たいてい〜を経験する（V）",
    examples: [
      {
        en: "People typically have three meals a day.",
        ja: "人はたいてい1日に3回食事をする。",
        enMark: ["typically have"],
        jaMark: ["たいてい"]
      },
      {
        en: "Students typically have a lot of homework before a test.",
        ja: "学生はテスト前にたいてい宿題がたくさんある。",
        enMark: ["typically have"],
        jaMark: ["たいてい"]
      }
    ]
  },
  {
    id: 24,
    term: "episodes of depression",
    ipa: "/ˈɛpɪsoʊdz əv dɪˈprɛʃən/",
    meaning: "うつの発症期間（O）",
    examples: [
      {
        en: "Some people have episodes of depression every winter.",
        ja: "冬のたびにうつの発症期間がある人もいる。",
        enMark: ["episodes of depression"],
        jaMark: ["うつの発症期間"]
      },
      {
        en: "Her doctor asked about her episodes of depression.",
        ja: "医師は彼女のうつの発症期間について尋ねた。",
        enMark: ["episodes of depression"],
        jaMark: ["うつの発症期間"]
      }
    ]
  },
  {
    id: 25,
    term: "that begin in the fall",
    ipa: "/ðət bɪˈɡɪn ɪn ðə ˈfɔːl/",
    meaning: "秋に始まる〜（関係代名詞節）",
    examples: [
      {
        en: "He has headaches that begin in the fall.",
        ja: "彼には秋に始まる頭痛がある。",
        enMark: ["that begin in the fall"],
        jaMark: ["秋に始まる"]
      },
      {
        en: "There are classes that begin in the fall.",
        ja: "秋に始まる授業もある。",
        enMark: ["that begin in the fall"],
        jaMark: ["秋に始まる"]
      }
    ]
  },
  {
    id: 26,
    term: "ease in the spring or summer",
    ipa: "/ˈiːz ɪn ðə ˈsprɪŋ ɔːr ˈsʌmər/",
    meaning: "春か夏に和らぐ（and で並列）",
    examples: [
      {
        en: "These problems ease in the spring or summer.",
        ja: "これらの問題は春か夏に和らぐ。",
        enMark: ["ease in the spring or summer"],
        jaMark: ["春か夏に和らぐ"]
      },
      {
        en: "Her sad feelings ease in the spring or summer.",
        ja: "彼女の沈んだ気持ちは春か夏に和らぐ。",
        enMark: ["ease in the spring or summer"],
        jaMark: ["春か夏に和らぐ"]
      }
    ]
  },

  /* ---- 構文：N estimated to do（〜と推定される…）--------------------- */
  {
    id: 27,
    term: "estimate",
    ipa: "/ˈɛstɪmeɪt/",
    meaning: "〜と見積もる、推定する",
    examples: [
      {
        en: "Police estimated that 2,000 people came to the event.",
        ja: "警察は2,000人がそのイベントに来たと推定した。",
        enMark: ["estimated"],
        jaMark: ["推定した"]
      },
      {
        en: "We estimate the trip will take two hours.",
        ja: "その移動には2時間かかると見積もっている。",
        enMark: ["estimate"],
        jaMark: ["見積もっている"]
      }
    ]
  },
  {
    id: 28,
    term: "estimated to have",
    ipa: "/ˈɛstɪmeɪtɪd tə ˈhæv/",
    meaning: "〜を持つと推定される（後置修飾）",
    examples: [
      {
        en: "Students estimated to have eye problems got bigger textbooks.",
        ja: "目に問題があると推定される生徒は、大きめの教科書をもらった。",
        enMark: ["estimated to have"],
        jaMark: ["推定される"]
      },
      {
        en: "Shops estimated to have more than 50 workers must follow the new rule.",
        ja: "従業員が50人を超えると推定される店は、新しいルールに従わなければならない。",
        enMark: ["estimated to have"],
        jaMark: ["推定される"]
      }
    ]
  },
  {
    id: 29,
    term: "estimated to be",
    ipa: "/ˈɛstɪmeɪtɪd tə ˈbi/",
    meaning: "〜だと推定される（後置修飾）",
    examples: [
      {
        en: "The tree estimated to be 500 years old is in the park.",
        ja: "樹齢500年と推定されるその木は公園にある。",
        enMark: ["estimated to be"],
        jaMark: ["推定される"]
      },
      {
        en: "The painting estimated to be 200 years old is very famous.",
        ja: "200年前のものと推定されるその絵はとても有名だ。",
        enMark: ["estimated to be"],
        jaMark: ["推定される"]
      }
    ]
  },
  {
    id: 30,
    term: "estimated to cost",
    ipa: "/ˈɛstɪmeɪtɪd tə ˈkɔːst/",
    meaning: "〜の費用がかかると推定される（後置修飾）",
    examples: [
      {
        en: "The new bridge estimated to cost 3 billion yen will open next year.",
        ja: "費用が30億円と推定される新しい橋は、来年開通する。",
        enMark: ["estimated to cost"],
        jaMark: ["推定される"]
      },
      {
        en: "A trip estimated to cost 100,000 yen is too expensive for me.",
        ja: "10万円かかると推定される旅行は、私には高すぎる。",
        enMark: ["estimated to cost"],
        jaMark: ["推定される"]
      }
    ]
  }
];
