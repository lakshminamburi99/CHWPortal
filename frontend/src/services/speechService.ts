/**
 * Care Compass Speech Service
 * Unified Web Speech API Engine for:
 * 1. Real-time Voice-to-Text Clinical Dictation (SpeechRecognition)
 * 2. Multilingual Audio Read-Aloud (SpeechSynthesis)
 * 3. WHO Pre-compiled Caregiver Discharge Guidance in 7 Languages
 */

export interface SupportedLanguage {
  code: string;
  locale: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', locale: 'en-US', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'sw', locale: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'fr', locale: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', locale: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'hi', locale: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', locale: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'pt', locale: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
];

export interface DictationSessionOptions {
  locale?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface CaregiverGuidanceItem {
  protocolKey: string;
  title: string;
  category: string;
  translations: Record<string, {
    spokenText: string;
    displayText: string;
    englishSummary: string;
  }>;
}

// ---------------------------------------------------------------------------
// Pre-Compiled Multilingual WHO Clinical Discharge Instructions
// ---------------------------------------------------------------------------
export const CAREGIVER_AUDIO_GUIDELINES: Record<string, CaregiverGuidanceItem> = {
  CHILD_PNEUMONIA: {
    protocolKey: 'CHILD_PNEUMONIA',
    title: 'Pediatric Fast Breathing & Pneumonia Home Watch',
    category: 'Child Health',
    translations: {
      en: {
        spokenText: 'Please watch your child carefully. Give all prescribed amoxicillin antibiotic doses for the full 5 days, even if the fever goes away. If your child develops chest indrawing, vomits everything, or is unable to drink, bring them to the hospital immediately.',
        displayText: 'Give full 5-day antibiotic course. Return immediately if chest indrawing, vomiting everything, or inability to drink occurs.',
        englishSummary: 'Pneumonia danger signs & antibiotic adherence.',
      },
      sw: {
        spokenText: 'Tafadhali mtazame mtoto wako kwa makini sana. Mpe dawa zote za amoksi-silini kama ulivyoelekezwa kwa siku zote tano. Mtoto akishindwa kunywa maji, akitapika kila kitu, au kifua kikivutika ndani, mlete hospitalini mara moja bila kuchelewa.',
        displayText: 'Mpe dawa zote za siku 5. Mlete hospitalini mara moja akishindwa kunywa, akitapika kila kitu, au kifua kikivutika ndani.',
        englishSummary: 'Swahili: Fast breathing danger signs & amoxicillin adherence.',
      },
      fr: {
        spokenText: 'Surveillez attentivement votre enfant. Donnez toutes les doses d\'amoxicilline pendant les 5 jours complets. Si votre enfant ne peut plus boire, vomit tout ou a des difficultés respiratoires avec tirage sous-costal, rendez-vous immédiatement à l\'hôpital.',
        displayText: 'Donnez le traitement antibiotique complet pendant 5 jours. Rendez-vous aux urgences si l\'enfant ne peut plus boire ou a un tirage sous-costal.',
        englishSummary: 'French: Respiratory danger signs and full antibiotic course.',
      },
      es: {
        spokenText: 'Por favor observe a su niño con atención. Administre todas las dosis de antibiótico durante los cinco días completos. Si el niño no puede beber líquidos, vomita todo o se le hunden las costillas al respirar, llévelo de inmediato al centro de salud.',
        displayText: 'Cumpla los 5 días de antibiótico. Regrese de urgencia si hay tiraje subcostal, vómitos continuos o incapacidad de beber.',
        englishSummary: 'Spanish: Pediatric fast breathing & emergency referral signs.',
      },
      hi: {
        spokenText: 'कृपया अपने बच्चे की सांस और हालत पर ध्यान दें। दी गई एंटीबायोटिक दवा पूरे पांच दिनों तक नियमित रूप से दें। यदि बच्चा पानी पीने में असमर्थ हो, सब कुछ उल्टी कर दे, या पसली चलने लगे, तो उसे तुरंत अस्पताल ले जाएं।',
        displayText: 'दवा पूरे 5 दिन दें। यदि पसली धंसे, बच्चा दूध न पी सके या उल्टी करे, तो तुरंत अस्पताल जाएं।',
        englishSummary: 'Hindi: Pediatric respiratory care and emergency danger signs.',
      },
      ar: {
        spokenText: 'يرجى مراقبة تنفس طفلك بعناية. يجب إعطاء جميع جرعات المضاد الحيوي لمدة خمسة أيام كاملة. إذا لاحظت صعوبة في التنفس أو عدم القدرة على الشرب أو قيء مستمر، توجه إلى المستشفى فوراً.',
        displayText: 'أكمل جرعات المضاد الحيوي لمدة 5 أيام. راجع المستشفى فوراً عند صعوبة التنفس أو القيء المستمر.',
        englishSummary: 'Arabic: Pediatric pneumonia warning signs and medication guidance.',
      },
      pt: {
        spokenText: 'Por favor, observe a respiração do seu filho com atenção. Dê todo o medicamento antibiótico durante os 5 dias completos. Se a criança não conseguir beber líquidos, vomitar tudo ou tiver tiragem no peito, leve-a imediatamente ao hospital.',
        displayText: 'Dê o antibiótico por 5 dias completos. Procure o hospital com urgência se houver dificuldade respiratória ou vômitos.',
        englishSummary: 'Portuguese: Child pneumonia danger signs and antibiotic compliance.',
      },
    },
  },
  CHILD_DIARRHEA: {
    protocolKey: 'CHILD_DIARRHEA',
    title: 'Oral Rehydration Salts (ORS) & Zinc Preparation',
    category: 'Child Health',
    translations: {
      en: {
        spokenText: 'Mix one full packet of Oral Rehydration Salts into one liter of clean drinking water. Give frequent sips after every loose stool. Give one Zinc tablet daily dissolved in breastmilk or water for fourteen days to protect the child\'s gut.',
        displayText: 'Mix 1 ORS packet in 1 liter clean water. Give sips after every stool. Give 1 Zinc tablet daily for 14 full days.',
        englishSummary: 'ORS mixing and 14-day Zinc supplementation protocol.',
      },
      sw: {
        spokenText: 'Changanya pakiti nzima ya ORS kwenye lita moja ya maji safi ya kunywa. Mpe mtoto anywe kiasi kidogo kidogo kila anapoendesha choo. Mpe kidonge kimoja cha Zinki kila siku kilichoyeyushwa kwenye maziwa au maji kwa siku kumi na nne.',
        displayText: 'Changanya pakiti 1 ya ORS kwenye lita 1 ya maji safi. Mpe mtoto baada ya kila choo. Mpe Zinki kila siku kwa siku 14.',
        englishSummary: 'Swahili: ORS preparation and 14-day Zinc adherence.',
      },
      fr: {
        spokenText: 'Mélangez un sachet complet de SRO dans un litre d\'eau propre potable. Donnez à boire par petites gorgées après chaque selle liquide. Donnez un comprimé de Zinc par jour dissous dans un peu d\'eau ou de lait maternel pendant quatorze jours.',
        displayText: 'Dissoudre 1 sachet de SRO dans 1 litre d\'eau propre. Donner après chaque selle. Donner le Zinc pendant 14 jours.',
        englishSummary: 'French: ORS mixing and 14-day Zinc therapy.',
      },
      es: {
        spokenText: 'Disuelva un sobre completo de Sales de Rehidratación Oral en un litro de agua hervida o limpia. Déle a sorbos pequeños después de cada evacuación líquida. Administre una tableta de Zinc al día durante catorce días completos.',
        displayText: 'Disuelva 1 sobre de SRO en 1 litro de agua limpia. Dé a sorbos tras cada deposición. Administre Zinc por 14 días.',
        englishSummary: 'Spanish: ORS hydration and 14-day Zinc routine.',
      },
      hi: {
        spokenText: 'ओआरएस के एक पूरे पैकेट को एक लीटर साफ पीने के पानी में मिलाएं। हर बार पतले दस्त के बाद बच्चे को थोड़ा-थोड़ा घोल पिलाएं। साथ ही जिंक की एक गोली मां के दूध या पानी में घोलकर पूरे चौदह दिनों तक रोजाना दें।',
        displayText: '1 पैकेट ओआरएस 1 लीटर साफ पानी में घोलें। हर दस्त के बाद पिलाएं। जिंक की गोली 14 दिन तक रोजाना दें।',
        englishSummary: 'Hindi: ORS preparation and 14-day Zinc protocol.',
      },
      ar: {
        spokenText: 'قم بإذابة كيس كامل من محلول معالجة الجفاف في لتر واحد من الماء النظيف. أعطِ الطفل رشفات بعد كل نوبة إسهال. أعطِ حبة واحدة من الزنك يومياً مذابة في الماء أو الحليب لمدة أربعة عشر يوماً.',
        displayText: 'إذابة كيس محلول الجفاف في لتر ماء نظيف. إعطاء رشفات بعد كل إسهال. إعطاء الزنك يومياً لمدة 14 يوماً.',
        englishSummary: 'Arabic: ORS mixing and Zinc supplementation.',
      },
      pt: {
        spokenText: 'Misture um pacote completo de Sais de Reidratação Oral em um litro de água limpa. Dê pequenos goles após cada evacuação líquida. Dê um comprimido de Zinco por dia dissolvido em leite ou água durante quatorze dias seguidos.',
        displayText: 'Misture 1 pacote de SRO em 1 litro de água limpa. Dê após cada diarreia. Administre o Zinco por 14 dias.',
        englishSummary: 'Portuguese: ORS rehydration and 14-day Zinc regimen.',
      },
    },
  },
  MATERNAL_ANC: {
    protocolKey: 'MATERNAL_ANC',
    title: 'Maternal Obstetric Danger Signs & Preeclampsia Watch',
    category: 'Maternal ANC',
    translations: {
      en: {
        spokenText: 'Congratulations on your pregnancy check-up. Please take your iron and folic acid tablets daily. If you experience severe frontal headache, blurred vision with flashing lights, pain under your ribs, or vaginal bleeding, go to the maternity hospital immediately.',
        displayText: 'Take daily Iron-Folic Acid. Go to hospital immediately if severe headache, blurred vision, upper belly pain, or bleeding occurs.',
        englishSummary: 'Maternal danger signs (headache, vision changes, bleeding).',
      },
      sw: {
        spokenText: 'Hongera kwa uchunguzi wako wa ujauzito. Tafadhali meza vidonge vyako vya madini ya chuma kila siku. Ukihisi maumivu makali ya kichwa, macho kuona giza au mianga, maumivu chini ya mbavu, au kutokwa na damu, nenda hospitalini mara moja.',
        displayText: 'Meza vidonge vya chuma kila siku. Nenda hospitalini mara moja ukipata maumivu makali ya kichwa, macho kuona giza, au damu.',
        englishSummary: 'Swahili: Antenatal danger signs & preeclampsia watch.',
      },
      fr: {
        spokenText: 'Félicitations pour votre consultation prénatale. Prenez vos comprimés de fer et d\'acide folique chaque jour. En cas de maux de tête sévères, vision trouble avec éclairs, douleurs abdominales ou saignements, rendez-vous d\'urgence à la maternité.',
        displayText: 'Prenez le fer quotidiennement. Urgence immédiate si maux de tête sévères, troubles visuels ou saignements.',
        englishSummary: 'French: Pregnancy danger signs and emergency clinic referral.',
      },
      es: {
        spokenText: 'Tome sus pastillas de hierro y ácido fólico todos los días. Si presenta dolor de cabeza intenso, visión borrosa con luces, dolor debajo de las costillas o sangrado vaginal, acuda de inmediato a la maternidad del hospital.',
        displayText: 'Tome hierro y ácido fólico a diario. Acuda al hospital de urgencia ante dolor de cabeza severo, visión borrosa o sangrado.',
        englishSummary: 'Spanish: Preeclampsia alerts and emergency maternal care.',
      },
      hi: {
        spokenText: 'गर्भावस्था में अपनी आयरन और फोलिक एसिड की गोलियां रोजाना लें। यदि आपको तेज सिरदर्द, आंखों के सामने धुंधलापन या चमक, पसलियों के नीचे दर्द, या रक्तस्राव हो, तो तुरंत अस्पताल पहुंचें।',
        displayText: 'आयरन की गोलियां रोजाना लें। तेज सिरदर्द, आंखों में धुंधलापन या रक्तस्राव होने पर तुरंत अस्पताल जाएं।',
        englishSummary: 'Hindi: Maternal danger signs and antenatal care guidance.',
      },
      ar: {
        spokenText: 'يرجى الاستمرار في تناول أقراص الحديد يومياً. إذا شعرت بصداع شديد، أو تشوش في الرؤية، أو ألم في أعلى البطن، أو أي نزيف، يجب التوجه فوراً إلى قسم الولادة بالمستشفى.',
        displayText: 'تناولي حبوب الحديد يومياً. توجهي للمستشفى فوراً عند حدوث صداع شديد، تشوش رؤية أو نزيف.',
        englishSummary: 'Arabic: Antenatal danger signs and hospital referral alerts.',
      },
      pt: {
        spokenText: 'Tome seus comprimidos de ferro e ácido fólico diariamente. Se tiver dor de cabeça muito forte, visão embaçada, dor debaixo das costelas ou qualquer sangramento, vá imediatamente à maternidade.',
        displayText: 'Tome o ferro diariamente. Procure a maternidade imediatamente em caso de dor de cabeça forte, visão turva ou sangramento.',
        englishSummary: 'Portuguese: Maternal hypertensive alerts and danger signs.',
      },
    },
  },
  MALARIA_FEVER: {
    protocolKey: 'MALARIA_FEVER',
    title: 'Malaria Treatment Adherence & Bednet Protection',
    category: 'Infectious Disease',
    translations: {
      en: {
        spokenText: 'Give the antimalarial tablets twice daily with a meal for three full days. Do not stop early even when the fever breaks. Always sleep inside an insecticide-treated mosquito bednet to prevent reinfection.',
        displayText: 'Take antimalarial tablets twice daily with food for 3 full days. Always sleep under a treated mosquito net.',
        englishSummary: 'Malaria 3-day ACT compliance and bednet use.',
      },
      sw: {
        spokenText: 'Mpe mgonjwa vidonge vya malaria mara mbili kwa siku pamoja na chakula kwa siku tatu kamili. Usiache kumeza hata kama homa imepungua. Lala ndani ya chandarua chenye dawa kila usiku kujikinga.',
        displayText: 'Meza dawa za malaria mara 2 kwa siku kwa siku 3 kamili. Lala ndani ya chandarua kilichotiwa dawa.',
        englishSummary: 'Swahili: Malaria ACT adherence & bednet prevention.',
      },
      fr: {
        spokenText: 'Prenez les comprimés antipaludiques deux fois par jour avec un repas pendant trois jours complets. N\'arrêtez pas le traitement même si la fièvre tombe. Dormez toujours sous une moustiquaire imprégnée.',
        displayText: 'Prendre les antipaludiques 2 fois par jour pendant 3 jours complets. Dormir sous moustiquaire imprégnée.',
        englishSummary: 'French: Malaria medication adherence and bednet use.',
      },
      es: {
        spokenText: 'Tome las pastillas contra la malaria dos veces al día con alimentos durante tres días completos. No suspenda el tratamiento aunque la fiebre desaparezca. Duerma siempre bajo un mosquitero tratado.',
        displayText: 'Tome el antipalúdico 2 veces al día por 3 días completos. Duerma siempre bajo mosquitero.',
        englishSummary: 'Spanish: Full 3-day antimalarial treatment and net usage.',
      },
      hi: {
        spokenText: 'मलेरिया की गोलियां भोजन के बाद दिन में दो बार पूरे तीन दिनों तक लें। बुखार उतरने पर भी दवा बीच में न छोड़ें। दोबारा मच्छर के काटने से बचने के लिए हमेशा मच्छरदानी में ही सोएं।',
        displayText: 'मलेरिया की दवा दिन में 2 बार पूरे 3 दिन लें। हमेशा मच्छरदानी में सोएं।',
        englishSummary: 'Hindi: 3-day malaria treatment completion and net use.',
      },
      ar: {
        spokenText: 'تناول أدوية الملاريا مرتين يومياً مع الطعام لمدة ثلاثة أيام كاملة. لا توقف الدواء حتى لو اختفت الحمى. احرص دائماً على النوم تحت ناموسية معالجة.',
        displayText: 'تناول علاج الملاريا مرتين يومياً لمدة 3 أيام كاملة. نم دائماً تحت الناموسية.',
        englishSummary: 'Arabic: Malaria treatment compliance and mosquito net protection.',
      },
      pt: {
        spokenText: 'Tome os comprimidos para malária duas vezes ao dia com alimentos durante três dias completos. Não pare antes mesmo que a febre passe. Durma sempre sob mosquiteiro tratado.',
        displayText: 'Tome o medicamento para malária por 3 dias completos. Durma sempre sob mosquiteiro.',
        englishSummary: 'Portuguese: 3-day malaria course and preventive bednet.',
      },
    },
  },
  CHRONIC_HYPERTENSION: {
    protocolKey: 'CHRONIC_HYPERTENSION',
    title: 'Hypertension Lifestyle, Low Sodium & Daily Medication',
    category: 'Chronic Disease',
    translations: {
      en: {
        spokenText: 'High blood pressure has no daily symptoms, but taking your blood pressure pill every morning protects your heart and brain from stroke. Limit salt in cooking to less than one teaspoon per day and walk for 30 minutes daily.',
        displayText: 'Take blood pressure pill every morning. Keep salt under 1 teaspoon daily and walk 30 minutes every day.',
        englishSummary: 'Hypertension daily medication and sodium reduction.',
      },
      sw: {
        spokenText: 'Shinikizo la damu mara nyingi halina dalili, lakini kumeza kidonge chako kila asubuhi kunalinda moyo na ubongo wako dhidi ya kiharusi. Punguza chumvi kwenye chakula hadi chini ya kijiko kimoja kwa siku na ufanye mazoezi ya kutembea.',
        displayText: 'Meza kidonge cha presha kila asubuhi. Punguza chumvi na tembea dakika 30 kila siku.',
        englishSummary: 'Swahili: Daily hypertension medication and lifestyle advice.',
      },
      fr: {
        spokenText: 'L\'hypertension artérielle n\'a souvent aucun symptôme visible, mais prendre votre médicament chaque matin protège votre cœur et votre cerveau. Réduisez le sel de cuisine et marchez trente minutes par jour.',
        displayText: 'Prenez votre comprimé chaque matin. Réduisez le sel et marchez 30 minutes par jour.',
        englishSummary: 'French: Daily antihypertensive adherence and diet counseling.',
      },
      es: {
        spokenText: 'La presión alta no suele dar síntomas, pero tomar su pastilla cada mañana previene infartos y derrames cerebrales. Reduzca la sal a menos de una cucharadita al día y camine treinta minutos diarios.',
        displayText: 'Tome su pastilla de la presión cada mañana. Reduzca la sal y camine 30 minutos al día.',
        englishSummary: 'Spanish: Daily hypertension pill and sodium control.',
      },
      hi: {
        spokenText: 'हाई ब्लड प्रेशर के कोई स्पष्ट लक्षण नहीं होते, लेकिन रोज सुबह दवा लेने से दिल का दौरा और लकवे से बचाव होता है। खाने में नमक की मात्रा कम करें और रोजाना 30 मिनट टहलें।',
        displayText: 'रोज सुबह बीपी की दवा लें। नमक कम खाएं और रोजाना 30 मिनट घूमें।',
        englishSummary: 'Hindi: Daily BP medication and low-salt lifestyle advice.',
      },
      ar: {
        spokenText: 'ارتفاع ضغط الدم غالباً ليس له أعراض يومية، لكن تناول حبتك كل صباح يحمي قلبك ودماغك من الجلطات. قلل الملح في الطعام إلى أقل من ملعقة صغيرة يومياً وامشِ لمدة ثلاثين دقيقة.',
        displayText: 'تناول حبة الضغط كل صباح. قلل الملح في الطعام ومارس المشي يومياً.',
        englishSummary: 'Arabic: Hypertension daily pill compliance and low sodium diet.',
      },
      pt: {
        spokenText: 'A pressão alta muitas vezes não dá sintomas, mas tomar seu remédio toda manhã protege seu coração contra derrames. Reduza o sal na comida para menos de uma colher de chá por dia e caminhe diariamente.',
        displayText: 'Tome seu remédio de pressão toda manhã. Reduza o sal e caminhe 30 minutos por dia.',
        englishSummary: 'Portuguese: Daily BP medicine compliance and diet advice.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// SpeechRecognition (Speech-to-Text) Controller
// ---------------------------------------------------------------------------
export class SpeechRecognitionSession {
  private recognition: any = null;
  private isListening: boolean = false;
  private options: DictationSessionOptions;

  constructor(options: DictationSessionOptions) {
    this.options = options;
  }

  public static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
  }

  public start(): boolean {
    if (!SpeechRecognitionSession.isSupported()) {
      if (this.options.onError) {
        this.options.onError('Web Speech API is not supported in this browser.');
      }
      return false;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.locale || 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.options.onStart) this.options.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }

        const activeText = finalTranscript || interimTranscript;
        if (activeText.trim()) {
          this.options.onResult(activeText.trim(), Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        if (this.options.onError) {
          if (event.error === 'not-allowed') {
            this.options.onError('Microphone permission denied. Please enable microphone permissions in your browser settings.');
          } else {
            this.options.onError(`Speech recognition notice: ${event.error}`);
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.options.onEnd) this.options.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      if (this.options.onError) this.options.onError(e?.message || 'Error starting microphone dictation');
      return false;
    }
  }

  public stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  public getActiveListening(): boolean {
    return this.isListening;
  }
}

// ---------------------------------------------------------------------------
// SpeechSynthesis (Text-to-Speech) Controller
// ---------------------------------------------------------------------------
export class SpeechSynthesisService {
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  public static speak(
    text: string,
    options: {
      lang?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): boolean {
    if (!this.isSupported()) {
      if (options.onError) options.onError('SpeechSynthesis not supported');
      return false;
    }

    // Cancel any previous active audio
    window.speechSynthesis.cancel();

    if (!text.trim()) return false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Pick best matching native voice if available
    const voices = this.getVoices();
    const langPrefix = (options.lang || 'en').split('-')[0].toLowerCase();
    const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  public static stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
  }

  public static pause(): void {
    if (this.isSupported()) {
      window.speechSynthesis.pause();
    }
  }

  public static resume(): void {
    if (this.isSupported()) {
      window.speechSynthesis.resume();
    }
  }

  public static isSpeaking(): boolean {
    if (!this.isSupported()) return false;
    return window.speechSynthesis.speaking;
  }
}
