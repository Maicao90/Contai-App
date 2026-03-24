interface LeadInfo {
  nomeEmpresa: string;
  nicho: string;
  cidade: string;
  telefone?: string | null;
  whatsapp?: string | null;
}

interface NichoConfig {
  primary: string;
  primaryDark: string;
  bg: string;
  card: string;
  services: Array<{ icon: string; name: string; desc: string }>;
  differentials: Array<{ icon: string; title: string; desc: string }>;
  faqs: Array<{ q: string; a: string }>;
  testimonials: Array<{ initials: string; name: string; text: string }>;
  heroTitle: (empresa: string, nicho: string, cidade: string) => string;
  heroSub: string;
  ctaUrgency: string;
  footerHours: string;
}

const NICHO_MAP: Record<string, NichoConfig> = {
  barbearia: {
    primary: "#e94560", primaryDark: "#c73650",
    bg: "#0d0d1a", card: "#161625",
    services: [
      { icon: "✂️", name: "Corte Masculino", desc: "Cortes modernos e clássicos com acabamento perfeito." },
      { icon: "🪒", name: "Barba", desc: "Modelagem e contorno de barba com navalha artesanal." },
      { icon: "💈", name: "Corte + Barba", desc: "O combo completo com desconto especial." },
      { icon: "🌿", name: "Hidratação Capilar", desc: "Tratamento profundo para cabelos danificados." },
      { icon: "🧴", name: "Coloração Masculina", desc: "Tingimento disfarce de grisalhos natural." },
      { icon: "👑", name: "Pacote VIP", desc: "Corte + barba + sobrancelha + lavagem premium." },
    ],
    differentials: [
      { icon: "⏱️", title: "Sem Filas, Hora Marcada", desc: "Agendamento online em 30 segundos. Seu tempo vale ouro." },
      { icon: "💈", title: "Barbeiros Experientes", desc: "Mais de 10 anos de experiência e cursos de aperfeiçoamento." },
      { icon: "🏆", title: "Produtos Premium", desc: "Usamos marcas top do mercado para garantir o melhor resultado." },
    ],
    faqs: [
      { q: "Preciso agendar ou posso ir sem hora marcada?", a: "Recomendamos agendar para garantir seu horário preferido, mas recebemos por ordem de chegada quando há disponibilidade." },
      { q: "Quanto tempo dura um corte completo?", a: "Em média 45 minutos para o combo corte + barba, e 30 minutos para somente o corte." },
      { q: "Vocês atendem crianças?", a: "Sim! Cortamos cabelos de crianças a partir de 3 anos com toda paciência e carinho." },
      { q: "Como faço para agendar?", a: "É só clicar no botão 'Falar no WhatsApp' aqui no site e escolher seu horário. É rápido e fácil!" },
      { q: "Quais são as formas de pagamento?", a: "Aceitamos dinheiro, PIX, débito e crédito (parcelamos em até 3x sem juros)." },
      { q: "Vocês têm estacionamento?", a: "Sim, há vagas disponíveis bem em frente à barbearia para sua comodidade." },
    ],
    testimonials: [
      { initials: "RS", name: "Rafael Souza", text: "Melhor barbearia que já fui! Profissionalismo total, ambiente ótimo e o resultado ficou impecável. Já indiquei para todos os amigos." },
      { initials: "LD", name: "Lucas Dias", text: "Atendimento excelente e preço justo. O corte ficou perfeito e durou bem mais do que eu esperava." },
      { initials: "MF", name: "Marcos Ferreira", text: "Finalmente encontrei uma barbearia de confiança! O barbeiro entendeu exatamente o que eu queria." },
    ],
    heroTitle: (empresa, _nicho, cidade) => `O Melhor Corte de ${cidade} Está Aqui`,
    heroSub: "Barbearia premium com agendamento online. Saia impecável em menos de 1 hora.",
    ctaUrgency: "Atendemos com hora marcada — vagas limitadas essa semana! Reserve o seu horário agora.",
    footerHours: "Seg–Sáb: 9h às 20h | Dom: 9h às 14h",
  },

  salao: {
    primary: "#e91e8c", primaryDark: "#c01870",
    bg: "#100a15", card: "#1a1020",
    services: [
      { icon: "💇", name: "Corte Feminino", desc: "Cortes personalizados que valorizam seu rosto." },
      { icon: "🎨", name: "Coloração", desc: "Colorações, mechas e balayage com técnicas modernas." },
      { icon: "💅", name: "Manicure & Pedicure", desc: "Unhas impecáveis com esmaltação comum ou em gel." },
      { icon: "✨", name: "Escova Progressiva", desc: "Fios alinhados, sem frizz, por até 6 meses." },
      { icon: "💆", name: "Tratamentos Capilares", desc: "Hidratação, nutrição e reconstrução para fios saudáveis." },
      { icon: "👰", name: "Penteado para Eventos", desc: "Penteados exclusivos para noivas, formaturas e festas." },
    ],
    differentials: [
      { icon: "🌟", title: "Especialistas em Beleza", desc: "Cabeleireiras formadas com cursos constantes de atualização." },
      { icon: "🌿", title: "Produtos de Alta Qualidade", desc: "Trabalhamos com marcas líderes que respeitam seus fios." },
      { icon: "📱", title: "Agendamento Fácil", desc: "Reserve seu horário pelo WhatsApp em menos de 1 minuto." },
    ],
    faqs: [
      { q: "Quanto tempo dura uma escova progressiva?", a: "Geralmente de 4 a 6 meses, dependendo do tipo de cabelo e da rotina de cuidados em casa." },
      { q: "Preciso agendar com antecedência?", a: "Para serviços como coloração e progressiva, recomendamos agendar com pelo menos 2 dias de antecedência." },
      { q: "Vocês fazem design de sobrancelha?", a: "Sim! Fazemos design e micropigmentação de sobrancelhas com resultados naturais e duradouros." },
      { q: "Como agendar meu horário?", a: "Clique no botão de WhatsApp aqui no site, nos informe o serviço desejado e escolha o melhor horário." },
      { q: "Aceitam cartão de crédito?", a: "Sim! Aceitamos todas as bandeiras, além de PIX e dinheiro. Parcelamos em até 6x." },
      { q: "Fazem atendimento para noivas?", a: "Sim! Temos pacotes completos para noivas com teste de penteado, maquiagem e assessoria de beleza." },
    ],
    testimonials: [
      { initials: "AC", name: "Ana Clara", text: "Meu cabelo nunca esteve tão lindo! A coloração ficou perfeita e as meninas são super atenciosas. Já sou cliente fiel!" },
      { initials: "JM", name: "Juliana Mendes", text: "Fiz a progressiva há 3 meses e ainda está incrível. Profissionalismo de ponta do início ao fim." },
      { initials: "PR", name: "Patrícia Rocha", text: "Ambiente aconchegante, atendimento personalizado e resultado que supera as expectativas. Recomendo a todas!" },
    ],
    heroTitle: (_e, _n, cidade) => `O Salão que Toda Mulher de ${cidade} Merece`,
    heroSub: "Beleza, cuidado e bem-estar em um só lugar. Agende seu horário e se transforme.",
    ctaUrgency: "Agenda cheia! Garanta seu horário antes que esgotem as vagas desta semana.",
    footerHours: "Seg–Sex: 9h às 19h | Sáb: 8h às 17h",
  },

  dentista: {
    primary: "#2196f3", primaryDark: "#1565c0",
    bg: "#080f1a", card: "#0e1825",
    services: [
      { icon: "🦷", name: "Clareamento Dental", desc: "Sorriso até 8 tons mais branco em uma sessão." },
      { icon: "🦺", name: "Restaurações", desc: "Tratamento estético com resinas de alta qualidade." },
      { icon: "🔬", name: "Implante Dentário", desc: "Solução definitiva para dentes perdidos." },
      { icon: "😁", name: "Lentes de Contato", desc: "Facetas ultrafinas para um sorriso perfeito." },
      { icon: "👶", name: "Odontopediatria", desc: "Cuidado especializado e lúdico para crianças." },
      { icon: "🛡️", name: "Manutenção Preventiva", desc: "Limpeza, profilaxia e avaliação completa." },
    ],
    differentials: [
      { icon: "🔬", title: "Tecnologia de Ponta", desc: "Equipamentos digitais de última geração para diagnóstico preciso." },
      { icon: "😌", title: "Atendimento Humanizado", desc: "Ambiente acolhedor e equipe treinada para pacientes ansiosos." },
      { icon: "📋", title: "Plano de Tratamento Transparente", desc: "Orçamento detalhado antes de qualquer procedimento, sem surpresas." },
    ],
    faqs: [
      { q: "O clareamento dental dói?", a: "Não! Usamos géis de alta qualidade que causam mínima sensibilidade. Pacientes com dentes mais sensíveis recebem tratamento preventivo antes." },
      { q: "Vocês atendem convênios?", a: "Sim, trabalhamos com os principais convênios odontológicos. Entre em contato para verificar se seu plano está incluído." },
      { q: "Quanto tempo dura um implante?", a: "Com cuidados adequados, um implante pode durar a vida toda. É a solução mais definitiva para dentes perdidos." },
      { q: "Como faço para agendar uma consulta?", a: "É só clicar no botão de WhatsApp aqui no site. Nossa equipe entra em contato rapidamente para agendar." },
      { q: "Fazem atendimento de emergência?", a: "Sim! Temos horários reservados para emergências como dor de dente, dentes quebrados e abscessos." },
      { q: "A partir de que idade posso trazer meu filho?", a: "Recomendamos a primeira consulta quando aparecer o primeiro dentinho, geralmente por volta dos 6 meses." },
    ],
    testimonials: [
      { initials: "CS", name: "Carla Silveira", text: "O clareamento transformou meu sorriso! A doutora é super atenciosa e o resultado superou minhas expectativas." },
      { initials: "RO", name: "Ricardo Oliveira", text: "Fiz meu implante e ficou perfeito! Não sinto diferença do dente natural. Profissionalismo exemplar." },
      { initials: "MB", name: "Maria Beatriz", text: "Minha filha tinha medo de dentista e agora adora ir! O atendimento com as crianças é maravilhoso." },
    ],
    heroTitle: (_e, _n, cidade) => `O Sorriso que Você Merece em ${cidade}`,
    heroSub: "Tratamentos odontológicos modernos com tecnologia de ponta e acolhimento humanizado.",
    ctaUrgency: "Agenda com vagas limitadas! Agende sua avaliação gratuita agora mesmo.",
    footerHours: "Seg–Sex: 8h às 18h | Sáb: 8h às 12h",
  },

  psicologo: {
    primary: "#7c3aed", primaryDark: "#5b21b6",
    bg: "#0a0812", card: "#120f1e",
    services: [
      { icon: "🧠", name: "Terapia Individual", desc: "Sessões personalizadas para seu crescimento emocional." },
      { icon: "👫", name: "Terapia de Casal", desc: "Fortalecimento de vínculos e resolução de conflitos." },
      { icon: "👨‍👩‍👧", name: "Terapia Familiar", desc: "Melhora das relações e dinâmicas familiares." },
      { icon: "🎯", name: "Avaliação Psicológica", desc: "Laudos e avaliações para diversas finalidades." },
      { icon: "💼", name: "Psicologia Organizacional", desc: "Desenvolvimento e bem-estar no ambiente de trabalho." },
      { icon: "🌱", name: "Terapia Online", desc: "Atendimento por videochamada com a mesma qualidade presencial." },
    ],
    differentials: [
      { icon: "🎓", title: "Profissional Certificado", desc: "CRP ativo e formações em abordagens reconhecidas pelo CFP." },
      { icon: "🤝", title: "Acolhimento Sem Julgamentos", desc: "Espaço seguro para você falar sobre tudo que sente." },
      { icon: "📅", title: "Horários Flexíveis", desc: "Atendimento manhã, tarde e noite para se encaixar na sua rotina." },
    ],
    faqs: [
      { q: "Como sei se preciso de terapia?", a: "Se você está se sentindo sobrecarregado, ansioso, triste ou com dificuldade nas relações, a terapia pode ajudar. Não é preciso ter um diagnóstico." },
      { q: "Quantas sessões são necessárias?", a: "Varia de pessoa para pessoa. Muitos notam melhorias em 8 a 12 sessões, mas o processo é individualizado." },
      { q: "As sessões são sigilosas?", a: "Sim, absolutamente. O sigilo profissional é garantido pelo Código de Ética do Psicólogo." },
      { q: "Como funciona o atendimento online?", a: "Por videochamada em plataforma segura. A efetividade é comprovada e você tem mais comodidade e privacidade." },
      { q: "Como agendar minha primeira consulta?", a: "Clique no botão de WhatsApp. Faremos uma breve conversa para entender suas necessidades antes de marcar." },
      { q: "Vocês emitem notas fiscais e recibos?", a: "Sim! Emitimos recibo para reembolso pelo convênio de saúde, quando aplicável." },
    ],
    testimonials: [
      { initials: "FB", name: "Fernanda Borges", text: "A terapia mudou minha vida. Em 6 meses consegui lidar com minha ansiedade de um jeito que nunca imaginei ser possível." },
      { initials: "TN", name: "Thiago Nunes", text: "Era cético no início, mas o profissionalismo e o acolhimento me conquistaram. Hoje indico para todos que precisam." },
      { initials: "AM", name: "Aline Martins", text: "Comecei a terapia online e é incrível. Mesma qualidade, ainda mais comodidade. Melhor investimento que fiz em mim mesma." },
    ],
    heroTitle: (_e, _n, cidade) => `Cuide da Sua Saúde Mental em ${cidade}`,
    heroSub: "Terapia humanizada e acolhedora. Presencial ou online, no seu ritmo.",
    ctaUrgency: "Vagas de avaliação gratuita disponíveis essa semana. Dê o primeiro passo hoje.",
    footerHours: "Seg–Sex: 8h às 20h | Sáb: 8h às 14h",
  },

  nutricionista: {
    primary: "#22c55e", primaryDark: "#15803d",
    bg: "#080f0a", card: "#0e1810",
    services: [
      { icon: "🥗", name: "Emagrecimento Saudável", desc: "Plano alimentar personalizado para perda de peso sustentável." },
      { icon: "💪", name: "Nutrição Esportiva", desc: "Alimentação estratégica para melhorar performance e ganho de massa." },
      { icon: "🤰", name: "Nutrição na Gestação", desc: "Acompanhamento nutricional para mãe e bebê saudáveis." },
      { icon: "🩺", name: "Doenças Crônicas", desc: "Controle nutricional de diabetes, hipertensão, colesterol e mais." },
      { icon: "🌱", name: "Nutrição Vegana/Vegetariana", desc: "Dietas plant-based balanceadas e saborosas." },
      { icon: "📊", name: "Bioimpedância", desc: "Avaliação corporal completa com análise de composição." },
    ],
    differentials: [
      { icon: "📱", title: "Acompanhamento pelo App", desc: "Suporte contínuo por aplicativo para dúvidas e ajustes no plano." },
      { icon: "🍳", title: "Receitas Práticas Inclusas", desc: "Cardápio com receitas saborosas e fáceis de preparar." },
      { icon: "🎯", title: "Metas Reais e Alcançáveis", desc: "Sem dietas radicais — resultados duradouros com qualidade de vida." },
    ],
    faqs: [
      { q: "Em quanto tempo começo a ver resultados?", a: "Com a dieta correta, a maioria dos pacientes nota mudanças em 3 a 4 semanas. Resultados sólidos aparecem em 2 a 3 meses." },
      { q: "Preciso passar por exames antes da consulta?", a: "Não é obrigatório, mas exames de sangue recentes ajudam a personalizar melhor o plano alimentar." },
      { q: "Vou ter que comer somente coisas sem sabor?", a: "Não! Nossa abordagem inclui alimentos que você gosta. Saúde e prazer podem (e devem) andar juntos." },
      { q: "Como é feita a consulta online?", a: "Por videochamada, com a mesma qualidade da presencial. Enviamos o plano alimentar digitalmente após a consulta." },
      { q: "Como agendar minha consulta?", a: "Clique no botão WhatsApp aqui no site e escolha o melhor horário para você." },
      { q: "Vocês atendem crianças?", a: "Sim! Especialistas em nutrição pediátrica para garantir que seu filho cresça com saúde e hábitos saudáveis." },
    ],
    testimonials: [
      { initials: "VS", name: "Viviane Santos", text: "Perdi 12kg em 4 meses sem passar fome e sem abandonar os alimentos que amo. O acompanhamento é diferenciado!" },
      { initials: "GC", name: "Guilherme Costa", text: "Meu desempenho na academia melhorou muito após ajustar a alimentação. O plano esportivo foi certeiro." },
      { initials: "RT", name: "Renata Torres", text: "Consegui controlar meu diabetes com alimentação. Nunca imaginei que comer bem poderia ser tão gostoso." },
    ],
    heroTitle: (_e, _n, cidade) => `Nutrição que Transforma Sua Vida em ${cidade}`,
    heroSub: "Plano alimentar 100% personalizado. Emagreça com saúde e sem abrir mão do prazer.",
    ctaUrgency: "Vagas limitadas esta semana! Agende sua avaliação nutricional agora.",
    footerHours: "Seg–Sex: 8h às 18h | Sáb: 8h às 12h",
  },

  academia: {
    primary: "#ef4444", primaryDark: "#b91c1c",
    bg: "#0f0808", card: "#1a0e0e",
    services: [
      { icon: "🏋️", name: "Musculação", desc: "Treinos orientados para hipertrofia, força e definição." },
      { icon: "🏃", name: "Cardio & Aeróbico", desc: "Esteiras, bikes e elípticos de última geração." },
      { icon: "🥊", name: "Lutas & Artes Marciais", desc: "Muay Thai, Jiu-Jitsu e Boxe para todos os níveis." },
      { icon: "🧘", name: "Yoga & Pilates", desc: "Flexibilidade, equilíbrio e saúde mental." },
      { icon: "🔥", name: "Treino Funcional", desc: "HIIT e treinos de alta intensidade para resultados rápidos." },
      { icon: "👤", name: "Personal Trainer", desc: "Treino personalizado com acompanhamento individual." },
    ],
    differentials: [
      { icon: "🏆", title: "Equipamentos Modernos", desc: "Aparelhos de última geração renovados regularmente." },
      { icon: "👨‍🏫", title: "Profissionais Especializados", desc: "Educadores físicos com CREF ativo e formação contínua." },
      { icon: "📅", title: "Horários Flexíveis", desc: "Abertos de manhã cedo até a noite para encaixar na sua rotina." },
    ],
    faqs: [
      { q: "Preciso de experiência prévia para treinar?", a: "Não! Recebemos iniciantes e fazemos uma avaliação física completa antes de montar seu treino." },
      { q: "Tem aulas em grupo?", a: "Sim! Oferecemos diversas modalidades em grupo como spinning, zumba, HIIT e pilates, inclusas no plano." },
      { q: "Quanto tempo leva para ver resultados?", a: "Com frequência de 3x por semana, resultados visíveis em 6 a 8 semanas. Consistência é a chave!" },
      { q: "Como faço para conhecer a academia?", a: "Oferecemos uma aula experimental gratuita! É só clicar no WhatsApp e agendar sua visita." },
      { q: "Quais são os planos disponíveis?", a: "Temos planos mensais, trimestrais e anuais com ótimo custo-benefício. Entre em contato para conhecer os valores." },
      { q: "Tem estacionamento?", a: "Sim! Temos estacionamento próprio gratuito para alunos." },
    ],
    testimonials: [
      { initials: "BP", name: "Bruno Pires", text: "Perdi 18kg em 5 meses treinando aqui! Os professores são incríveis e o ambiente super motivante." },
      { initials: "CF", name: "Camila Fonseca", text: "As aulas de muay thai mudaram minha vida! Fiquei muito mais confiante e em forma. Recomendo demais!" },
      { initials: "JR", name: "João Ribeiro", text: "Melhor academia que já frequentei! Equipamentos modernos, ambiente limpo e equipe sempre disposta a ajudar." },
    ],
    heroTitle: (_e, _n, cidade) => `A Academia que Move ${cidade}`,
    heroSub: "Estrutura completa, instrutores certificados e resultados reais. Comece sua transformação hoje.",
    ctaUrgency: "Aula experimental GRÁTIS disponível! Agende a sua agora e sinta a diferença.",
    footerHours: "Seg–Sex: 6h às 22h | Sáb: 7h às 18h | Dom: 8h às 14h",
  },

  veterinario: {
    primary: "#10b981", primaryDark: "#047857",
    bg: "#080f0a", card: "#0e180f",
    services: [
      { icon: "🩺", name: "Consultas Clínicas", desc: "Avaliação geral da saúde do seu animal com carinho e atenção." },
      { icon: "💉", name: "Vacinação", desc: "Calendário completo de vacinas para cães e gatos." },
      { icon: "🔬", name: "Exames Laboratoriais", desc: "Hemograma, urina, fezes e outros exames essenciais." },
      { icon: "🏥", name: "Cirurgias", desc: "Procedimentos cirúrgicos com anestesistas especializados." },
      { icon: "✂️", name: "Banho & Tosa", desc: "Estética animal com produtos hipoalergênicos e carinho." },
      { icon: "🦷", name: "Odontologia Veterinária", desc: "Limpeza dentária e tratamentos bucais para pets." },
    ],
    differentials: [
      { icon: "❤️", title: "Amor pelos Animais", desc: "Nossos veterinários tratam cada paciente como se fosse da família." },
      { icon: "🔬", title: "Diagnóstico Preciso", desc: "Laboratório próprio com resultados rápidos para agilizar o tratamento." },
      { icon: "🚑", title: "Atendimento de Emergência", desc: "Disponíveis para urgências quando seu pet mais precisa." },
    ],
    faqs: [
      { q: "Com que frequência devo vacinar meu pet?", a: "Filhotes seguem um calendário intensivo nos primeiros meses. Adultos geralmente precisam de reforços anuais. Avaliamos cada caso." },
      { q: "Preciso de consulta para fazer banho e tosa?", a: "Não! O banho e tosa é agendado separadamente. Mas recomendamos uma consulta de rotina periódica." },
      { q: "Atendem animais exóticos?", a: "Sim! Além de cães e gatos, atendemos pássaros, répteis, coelhos e outros pequenos mamíferos." },
      { q: "Como agendar uma consulta?", a: "Pelo WhatsApp! Clique no botão aqui no site, informe a espécie e o motivo da consulta." },
      { q: "Vocês fazem castrações?", a: "Sim! Realizamos castrações com protocolo seguro, anestesia monitorada e cuidados pós-operatórios completos." },
      { q: "Tem internação?", a: "Sim, dispomos de internação com monitoramento 24h para casos que exigem acompanhamento contínuo." },
    ],
    testimonials: [
      { initials: "LA", name: "Letícia Alves", text: "A Dra. é incrível! Minha cachorrinha ficou ótima após a cirurgia. Atendimento humanizado com os animais e os tutores." },
      { initials: "PM", name: "Paulo Moura", text: "Levo meus 3 gatos aqui há 5 anos. Confiança total na equipe. Ambiente limpo e profissional." },
      { initials: "GS", name: "Gabriela Souza", text: "Passei por uma emergência com meu cachorro às 22h e fui atendida prontamente. Salvaram a vida do meu bebê!" },
    ],
    heroTitle: (_e, _n, cidade) => `O Melhor Cuidado para Seu Pet em ${cidade}`,
    heroSub: "Veterinários apaixonados por animais. Seu companheiro merece o melhor atendimento.",
    ctaUrgency: "Agende a consulta do seu pet hoje! Vagas disponíveis essa semana.",
    footerHours: "Seg–Sex: 8h às 19h | Sáb: 8h às 17h | Dom: 8h às 12h (emergências)",
  },

  advogado: {
    primary: "#b45309", primaryDark: "#92400e",
    bg: "#0f0e08", card: "#1a180e",
    services: [
      { icon: "⚖️", name: "Direito Civil", desc: "Contratos, indenizações, responsabilidade civil e mais." },
      { icon: "👨‍👩‍👧", name: "Direito de Família", desc: "Divórcio, guarda, pensão alimentícia e inventário." },
      { icon: "💼", name: "Direito Trabalhista", desc: "Defesa dos seus direitos como trabalhador ou empregador." },
      { icon: "🏘️", name: "Direito Imobiliário", desc: "Compra, venda, locação e regularização de imóveis." },
      { icon: "🛡️", name: "Direito Penal", desc: "Defesa criminal e assessoria em inquéritos e processos." },
      { icon: "📋", name: "Consultoria Jurídica", desc: "Orientação preventiva para evitar problemas legais." },
    ],
    differentials: [
      { icon: "🎓", title: "Expertise Comprovada", desc: "Advogados com OAB ativa e especialização nas áreas de atuação." },
      { icon: "🤝", title: "Atendimento Personalizado", desc: "Você fala diretamente com o advogado responsável pelo seu caso." },
      { icon: "📊", title: "Honorários Transparentes", desc: "Sem surpresas. Orçamento claro antes de qualquer compromisso." },
    ],
    faqs: [
      { q: "A primeira consulta é gratuita?", a: "Realizamos uma triagem gratuita pelo WhatsApp para entender seu caso antes de agendar a consulta formal." },
      { q: "Quanto tempo dura um processo?", a: "Varia muito conforme a complexidade e a vara. Trabalhamos para buscar a solução mais rápida possível." },
      { q: "Vocês fazem acordos extrajudiciais?", a: "Sim! Sempre que possível, buscamos acordos que resolvam a questão mais rápido e com menor custo." },
      { q: "Como agendar uma consulta?", a: "Pelo WhatsApp! Descreva brevemente seu caso e agendaremos a consulta no horário mais conveniente." },
      { q: "Atendem em outras cidades?", a: "Sim, podemos atuar em todo o estado e consultas online estão disponíveis para clientes de qualquer localidade." },
      { q: "Quais documentos devo trazer na consulta?", a: "Depende do caso. Oriente-se pelo WhatsApp antes da consulta para garantir um atendimento completo." },
    ],
    testimonials: [
      { initials: "EP", name: "Eduardo Pinto", text: "Ganhei minha causa trabalhista com excelente resultado. Profissionais competentes e sempre disponíveis." },
      { initials: "SM", name: "Sandra Mello", text: "O divórcio foi conduzido com muita sensibilidade e competência. Resolvemos tudo de forma amigável." },
      { initials: "FG", name: "Felipe Gomes", text: "Assessoria jurídica preventiva que me poupou um problema enorme. Recomendo sem hesitar." },
    ],
    heroTitle: (_e, _n, cidade) => `Seus Direitos Defendidos em ${cidade}`,
    heroSub: "Advocacia comprometida com resultados. Consulte-nos antes que o problema se agrave.",
    ctaUrgency: "Cada dia sem orientação jurídica pode custar caro. Fale com um advogado agora.",
    footerHours: "Seg–Sex: 9h às 18h | Atendimentos com hora marcada",
  },

  restaurante: {
    primary: "#f97316", primaryDark: "#c2410c",
    bg: "#0f0900", card: "#1a1200",
    services: [
      { icon: "🍽️", name: "Almoço Executivo", desc: "Prato principal, acompanhamentos e sobremesa por um preço especial." },
      { icon: "🥩", name: "Grelhados Premium", desc: "Carnes selecionadas preparadas na hora com temperos exclusivos." },
      { icon: "🍕", name: "Pizzas Artesanais", desc: "Massa fermentada 48h com ingredientes selecionados." },
      { icon: "🎂", name: "Eventos & Comemorações", desc: "Cardápio especial para aniversários, confraternizações e casamentos." },
      { icon: "📦", name: "Delivery", desc: "Entrega rápida em toda a cidade com embalagem especial." },
      { icon: "🍷", name: "Carta de Vinhos", desc: "Seleção de vinhos nacionais e importados para harmonizar." },
    ],
    differentials: [
      { icon: "👨‍🍳", title: "Chef Experiente", desc: "Culinária elaborada por chef com mais de 15 anos de experiência." },
      { icon: "🌿", title: "Ingredientes Frescos", desc: "Compramos direto dos produtores locais para garantir frescor." },
      { icon: "🏡", title: "Ambiente Aconchegante", desc: "Espaço decorado para um jantar íntimo ou celebração especial." },
    ],
    faqs: [
      { q: "Precisa de reserva?", a: "Para fins de semana e grupos acima de 6 pessoas, recomendamos reservar. Durante a semana, geralmente há mesas disponíveis." },
      { q: "Tem opções vegetarianas/veganas?", a: "Sim! Nosso cardápio inclui várias opções plant-based criadas com o mesmo capricho dos pratos tradicionais." },
      { q: "Fazem entregas?", a: "Sim! Entregamos em toda a cidade por plataformas próprias e por aplicativos. Mínimo para delivery: R$ 40." },
      { q: "Como reservar um espaço para eventos?", a: "Clique no WhatsApp e nos conte sobre seu evento. Elaboramos uma proposta personalizada." },
      { q: "Tem estacionamento?", a: "Sim, temos vagas próprias e convênio com estacionamento próximo para dias de maior movimento." },
      { q: "Aceitam cartão de crédito?", a: "Sim! Aceitamos todas as bandeiras, PIX e dinheiro. Não há taxa adicional para cartão." },
    ],
    testimonials: [
      { initials: "CA", name: "Carolina Azevedo", text: "Melhor restaurante da cidade sem dúvidas! Fui para jantar de aniversário e superou todas as expectativas." },
      { initials: "HM", name: "Hugo Monteiro", text: "O fraldinha grelhado é simplesmente impecável. Virei cliente assíduo do almoço executivo." },
      { initials: "DR", name: "Daniela Rocha", text: "Fizemos a confraternização da empresa aqui e todo mundo adorou. Serviço impecável e comida incrível." },
    ],
    heroTitle: (_e, _n, cidade) => `O Sabor que ${cidade} Merecia`,
    heroSub: "Culinária apaixonada com ingredientes selecionados. Uma experiência gastronômica completa.",
    ctaUrgency: "Mesas limitadas nos fins de semana! Reserve a sua pelo WhatsApp agora.",
    footerHours: "Ter–Dom: 12h às 15h | 19h às 23h | Segunda: Fechado",
  },

  fotografia: {
    primary: "#f59e0b", primaryDark: "#b45309",
    bg: "#0a0a0a", card: "#141414",
    services: [
      { icon: "📸", name: "Ensaio Feminino", desc: "Sessões empoderadoras que revelam sua beleza única." },
      { icon: "💑", name: "Ensaio de Casal", desc: "Memórias eternas do amor de vocês dois." },
      { icon: "👶", name: "Newborn & Gestante", desc: "Os primeiros momentos do seu bebê eternizados com delicadeza." },
      { icon: "🎓", name: "Formatura", desc: "Registro profissional da conquista mais importante da sua vida." },
      { icon: "💍", name: "Casamentos", desc: "Cada detalhe do seu dia perfeito capturado com arte." },
      { icon: "🏢", name: "Fotografia Corporativa", desc: "Perfis profissionais e fotos institucionais para sua empresa." },
    ],
    differentials: [
      { icon: "🎨", title: "Estilo Artístico Único", desc: "Edição com identidade visual exclusiva e resultados diferenciados." },
      { icon: "⚡", title: "Entrega Rápida", desc: "Fotos editadas e entregues em até 7 dias após o ensaio." },
      { icon: "🖨️", title: "Álbuns e Impressões", desc: "Produtos físicos de alta qualidade para eternizar suas memórias." },
    ],
    faqs: [
      { q: "Quanto tempo dura um ensaio?", a: "Depende do pacote. Ensaios femininos e de casal duram entre 1h e 3h. Casamentos podem ter cobertura de 6h a 12h." },
      { q: "O que devo usar no ensaio?", a: "Após a contratação, enviamos um guia completo de figurino e dicas para você arrasar nas fotos!" },
      { q: "Em quanto tempo recebo as fotos?", a: "Ensaios: até 15 dias. Casamentos: até 60 dias. Você recebe um link privado para download em alta resolução." },
      { q: "Como agendar meu ensaio?", a: "Clique no WhatsApp! Vamos conversar sobre o tema, data e local que mais combinam com você." },
      { q: "Vocês disponibilizam as fotos brutas (sem edição)?", a: "Não entregamos as fotos brutas. Todas as imagens passam pelo nosso processo artístico de edição." },
      { q: "Trabalham em estúdio ou em locações externas?", a: "Ambos! Temos estúdio próprio e adoramos explorar locações externas que combinam com a personalidade do cliente." },
    ],
    testimonials: [
      { initials: "IS", name: "Isabela Souza", text: "Meu ensaio feminino foi uma experiência incrível! As fotos ficaram simplesmente lindas. Me senti uma diva!" },
      { initials: "MC", name: "Marcos e Camila", text: "As fotos do nosso casamento são obras de arte. Capturou cada emoção do dia de forma perfeita." },
      { initials: "LF", name: "Larissa Fontes", text: "Fiz o ensaio gestante e chorei de emoção ao ver o resultado. Profissional incrível e super atenciosa." },
    ],
    heroTitle: (_e, _n, cidade) => `Fotografias que Contam Sua História em ${cidade}`,
    heroSub: "Momentos únicos eternizados com arte e sensibilidade. Agende seu ensaio hoje.",
    ctaUrgency: "Agenda disputada! Garante sua data antes que esgote. Fale agora pelo WhatsApp.",
    footerHours: "Seg–Sáb: 9h às 18h | Ensaios aos domingos com agendamento",
  },

  oficina: {
    primary: "#6366f1", primaryDark: "#4338ca",
    bg: "#080810", card: "#10101a",
    services: [
      { icon: "🔧", name: "Revisão Completa", desc: "Verificação de todos os sistemas do veículo com relatório detalhado." },
      { icon: "🛞", name: "Alinhamento & Balanceamento", desc: "Direção precisa e menor desgaste dos pneus." },
      { icon: "🔋", name: "Elétrica Automotiva", desc: "Diagnóstico e reparo de todo o sistema elétrico." },
      { icon: "❄️", name: "Ar-Condicionado", desc: "Manutenção, higienização e recarga do sistema de ar." },
      { icon: "🛢️", name: "Troca de Óleo", desc: "Óleos sintéticos e semi-sintéticos das melhores marcas." },
      { icon: "🚗", name: "Funilaria & Pintura", desc: "Reparos com matching de cor perfeito para seu veículo." },
    ],
    differentials: [
      { icon: "🔬", title: "Scanner Computadorizado", desc: "Diagnóstico eletrônico preciso para todas as marcas e modelos." },
      { icon: "✅", title: "Garantia nos Serviços", desc: "Todos os serviços com garantia documentada por escrito." },
      { icon: "📋", title: "Orçamento Sem Compromisso", desc: "Avaliamos gratuitamente e explicamos tudo antes de começar." },
    ],
    faqs: [
      { q: "Preciso agendar ou posso ir direto?", a: "Para revisões e serviços maiores, recomendamos agendar. Trocas de óleo e alinhamento geralmente atendemos na hora." },
      { q: "Vocês trabalham com todos os modelos?", a: "Sim! Atendemos carros nacionais e importados de todas as marcas e modelos." },
      { q: "Tem orçamento gratuito?", a: "Sim! Avaliamos e orçamos sem custo. Você decide se quer continuar antes de qualquer serviço." },
      { q: "Como acompanho o andamento do serviço?", a: "Atualizamos você pelo WhatsApp durante o processo. Sem surpresas na hora de buscar o veículo." },
      { q: "Aceitam planos de seguros?", a: "Sim, trabalhamos com os principais seguros e aceitamos ordem de serviço diretamente." },
      { q: "Tem carro reserva?", a: "Disponibilizamos carro de cortesia para serviços que levam mais de 1 dia, sujeito à disponibilidade." },
    ],
    testimonials: [
      { initials: "AF", name: "Anderson Ferreira", text: "Sempre saio satisfeito! Serviço de qualidade, preço justo e nunca me enganaram. Confiança total!" },
      { initials: "RM", name: "Roberta Maia", text: "Fiz a revisão completa e detectaram um problema antes que virasse algo sério. Profissionalismo de verdade." },
      { initials: "DC", name: "Diego Cardoso", text: "O scanner deles encontrou um problema que 2 oficinas anteriores não acharam. Problema resolvido na hora." },
    ],
    heroTitle: (_e, _n, cidade) => `Sua Oficina de Confiança em ${cidade}`,
    heroSub: "Diagnóstico preciso, mão de obra qualificada e preço justo. Seu carro em boas mãos.",
    ctaUrgency: "Agenda com vagas limitadas! Não deixe para quando o problema aumentar.",
    footerHours: "Seg–Sex: 7h30 às 18h | Sáb: 7h30 às 13h",
  },

  arquiteto: {
    primary: "#a78bfa", primaryDark: "#7c3aed",
    bg: "#080812", card: "#10101e",
    services: [
      { icon: "🏠", name: "Projeto Residencial", desc: "Casas e apartamentos planejados para seu estilo de vida." },
      { icon: "🏢", name: "Projeto Comercial", desc: "Espaços de trabalho funcionais e esteticamente impactantes." },
      { icon: "🔄", name: "Reforma & Retrofit", desc: "Transformamos imóveis existentes com inteligência e bom gosto." },
      { icon: "🛋️", name: "Design de Interiores", desc: "Ambientes harmoniosos que refletem sua personalidade." },
      { icon: "📐", name: "Render 3D", desc: "Visualize seu projeto antes da obra com realismo total." },
      { icon: "📋", name: "Gerenciamento de Obra", desc: "Acompanhamento profissional para sua obra sair como planejado." },
    ],
    differentials: [
      { icon: "🎨", title: "Design Exclusivo", desc: "Cada projeto é único e desenvolvido especialmente para você." },
      { icon: "📱", title: "Visualização 3D Real", desc: "Veja seu imóvel pronto antes de gastar um centavo em obra." },
      { icon: "🤝", title: "Parceiros Confiáveis", desc: "Rede de fornecedores e empreiteiros de qualidade comprovada." },
    ],
    faqs: [
      { q: "Quanto custa um projeto arquitetônico?", a: "O valor varia conforme a metragem e complexidade. Fazemos uma visita gratuita para elaborar um orçamento preciso." },
      { q: "Quanto tempo leva um projeto?", a: "Projetos residenciais típicos levam de 30 a 90 dias. Gerenciamos cronogramas para não atrasar sua obra." },
      { q: "Vocês acompanham a obra?", a: "Sim! Oferecemos gerenciamento completo de obra para garantir que tudo seja executado conforme o projeto." },
      { q: "Posso ver como vai ficar antes de começar?", a: "Claro! Produzimos renders 3D fotorrealistas para você ver cada detalhe do projeto antes da obra." },
      { q: "Trabalham fora da cidade?", a: "Sim! Atendemos cidades da região e até outros estados para projetos de maior porte." },
      { q: "Como começa o processo?", a: "Com uma conversa pelo WhatsApp seguida de uma visita técnica gratuita ao imóvel." },
    ],
    testimonials: [
      { initials: "MV", name: "Marcos Vieira", text: "Nossa casa ficou exatamente como sonhávamos. O render 3D ajudou muito nas decisões. Profissional excepcional!" },
      { initials: "AP", name: "Aline Pereira", text: "A reforma do nosso escritório valorizou o espaço e melhorou muito o ambiente de trabalho. Incrível!" },
      { initials: "HS", name: "Henrique Souza", text: "O gerenciamento de obra foi fundamental para terminar no prazo e dentro do orçamento. Confiança total." },
    ],
    heroTitle: (_e, _n, cidade) => `Arquitetura que Realiza Sonhos em ${cidade}`,
    heroSub: "Do projeto ao acabamento, transformamos sua visão em realidade com excelência.",
    ctaUrgency: "Agenda limitada de visitas gratuitas! Solicite a sua antes que esgotem.",
    footerHours: "Seg–Sex: 9h às 18h | Visitas técnicas com agendamento",
  },

  escola: {
    primary: "#3b82f6", primaryDark: "#1d4ed8",
    bg: "#080f1a", card: "#0e1825",
    services: [
      { icon: "📚", name: "Inglês", desc: "Do básico ao avançado com método comunicativo." },
      { icon: "🇪🇸", name: "Espanhol", desc: "Conversação natural para viagens e negócios." },
      { icon: "🇫🇷", name: "Francês", desc: "Cultura e idioma em aulas dinâmicas e envolventes." },
      { icon: "👶", name: "Turmas Kids", desc: "Inglês para crianças com metodologia lúdica." },
      { icon: "💼", name: "Inglês para Negócios", desc: "Comunicação profissional em reuniões e e-mails." },
      { icon: "🌐", name: "Aulas Online", desc: "Aprenda no seu ritmo de qualquer lugar." },
    ],
    differentials: [
      { icon: "🎯", title: "Método Rápido e Eficiente", desc: "Alunos conversando no idioma a partir do 1º mês de aula." },
      { icon: "👨‍🏫", title: "Professores Nativos e Certificados", desc: "Equipe com certificações internacionais e experiência abroad." },
      { icon: "📱", title: "Plataforma Digital Inclusa", desc: "App exclusivo com exercícios e conteúdos extras para praticar." },
    ],
    faqs: [
      { q: "Preciso ter base no idioma para começar?", a: "Não! Temos turmas para todos os níveis, do iniciante ao avançado." },
      { q: "Quantas vezes por semana são as aulas?", a: "Oferecemos turmas de 2 a 3x por semana. Há opções de horário manhã, tarde e noite." },
      { q: "Em quanto tempo fico fluente?", a: "Com dedicação, alunos atingem fluência em 18 a 24 meses. Muitos já conversam bem em 6 meses!" },
      { q: "Tem aula experimental?", a: "Sim! Oferecemos uma aula gratuita para você conhecer o método e a equipe antes de se matricular." },
      { q: "Como funciona o material didático?", a: "Material exclusivo da escola incluso na mensalidade. Sem custos extras surpresa." },
      { q: "Como fazer a matrícula?", a: "Pelo WhatsApp! Agendamos sua aula experimental gratuita e apresentamos todos os planos." },
    ],
    testimonials: [
      { initials: "KR", name: "Karla Reis", text: "Em 8 meses já estava me comunicando em inglês no trabalho! O método é incrível e os professores são ótimos." },
      { initials: "NL", name: "Nelson Lima", text: "Fiz intercâmbio e me saí muito bem graças à preparação aqui. Me sinto mais confiante do que nunca." },
      { initials: "TF", name: "Tatiana Figueiredo", text: "Minha filha de 8 anos já faz diálogos em inglês! As aulas kids são maravilhosas e ela adora." },
    ],
    heroTitle: (_e, _n, cidade) => `Fale Inglês com Confiança em ${cidade}`,
    heroSub: "Método inovador que coloca você conversando rápido. Aula experimental grátis!",
    ctaUrgency: "Novas turmas abertas! Vagas limitadas. Garanta a sua agora mesmo.",
    footerHours: "Seg–Sex: 7h às 22h | Sáb: 8h às 14h",
  },

  personal: {
    primary: "#f97316", primaryDark: "#c2410c",
    bg: "#0f0808", card: "#1a1010",
    services: [
      { icon: "🏋️", name: "Treino de Força", desc: "Musculação planejada para seus objetivos específicos." },
      { icon: "🏃", name: "Condicionamento Físico", desc: "Cardio inteligente para emagrecer e ganhar resistência." },
      { icon: "🧘", name: "Mobilidade & Alongamento", desc: "Movimento fluido e prevenção de lesões." },
      { icon: "🥊", name: "Treino Funcional", desc: "Exercícios que melhoram o desempenho no dia a dia." },
      { icon: "🏠", name: "Treino em Domicílio", desc: "Personal na sua casa com ou sem equipamentos." },
      { icon: "📊", name: "Avaliação Física", desc: "Teste completo para definir seu ponto de partida ideal." },
    ],
    differentials: [
      { icon: "🎯", title: "100% Personalizado", desc: "Treino feito do zero para o seu corpo, objetivos e limitações." },
      { icon: "📈", title: "Resultados Mensuráveis", desc: "Acompanhamento com fotos e avaliações mensais para você ver a evolução." },
      { icon: "🕐", title: "Flexibilidade de Horário", desc: "Treinos disponíveis de manhã cedo à noite. Você escolhe." },
    ],
    faqs: [
      { q: "Tenho problemas de saúde. Posso treinar com personal?", a: "Sim! Justamente por isso o personal é ideal. Adaptamos o treino para sua condição de forma segura e eficiente." },
      { q: "Treina em academia ou em casa?", a: "Ambos! Atendo em academias parceiras, ao ar livre e também em domicílio com equipamentos mínimos." },
      { q: "Quantas vezes por semana devo treinar?", a: "Recomendamos 3x por semana para resultados consistentes, mas montamos a frequência ideal para sua rotina." },
      { q: "Como é feita a primeira avaliação?", a: "Inclui testes de força, flexibilidade, composição corporal e conversamos sobre seus objetivos e histórico." },
      { q: "Posso fazer uma aula experimental?", a: "Sim! Agendamos um treino de avaliação gratuito para você conhecer o método antes de contratar." },
      { q: "Como agendar?", a: "Pelo WhatsApp! Clique no botão aqui no site e escolha a data do seu treino experimental gratuito." },
    ],
    testimonials: [
      { initials: "EV", name: "Eduardo Vilar", text: "Emagreci 15kg em 5 meses com o personal. Treino eficiente, suporte constante e resultado real. Valeu muito!" },
      { initials: "BN", name: "Beatriz Neves", text: "Tinha dor nas costas há anos. Com o treino adaptado, melhorei 100% em 3 meses. Vida transformada!" },
      { initials: "CM", name: "Carlos Meireles", text: "O nível de personalização é impressionante. Cada treino é pensado especificamente para mim. Incrível!" },
    ],
    heroTitle: (_e, _n, cidade) => `Seu Personal Trainer em ${cidade}`,
    heroSub: "Treino 100% personalizado com acompanhamento individual. Resultado garantido.",
    ctaUrgency: "Vagas limitadas! Agende seu treino experimental GRÁTIS hoje mesmo.",
    footerHours: "Atendimento personalizado: 6h às 22h com agendamento",
  },

  cerimonialista: {
    primary: "#d97706", primaryDark: "#b45309",
    bg: "#100c06", card: "#1a1508",
    services: [
      { icon: "💍", name: "Casamentos", desc: "Da decoração ao cerimonial, seu dia perfeito nas nossas mãos." },
      { icon: "🎂", name: "Aniversários 15 anos", desc: "Festa de debutante inesquecível com toda a magia." },
      { icon: "🎉", name: "Confraternizações", desc: "Eventos corporativos e confraternizações empresariais." },
      { icon: "💒", name: "Formaturas", desc: "Colação e baile memoráveis para sua turma." },
      { icon: "🌸", name: "Decoração Floral", desc: "Arranjos exclusivos que transformam qualquer espaço." },
      { icon: "📋", name: "Day Off (Assessoria)", desc: "Presente no dia para que você curta sem preocupações." },
    ],
    differentials: [
      { icon: "✨", title: "Cada Evento Único", desc: "Personalizamos cada detalhe para refletir sua personalidade e estilo." },
      { icon: "🤝", title: "Fornecedores de Confiança", desc: "Rede de parceiros verificados: buffet, fotografia, DJ, floricultura." },
      { icon: "📱", title: "Suporte Até o Fim", desc: "Presentes do planejamento ao último convidado ir embora." },
    ],
    faqs: [
      { q: "Com quanto tempo de antecedência devo contratar?", a: "Recomendamos pelo menos 6 meses para casamentos e 3 meses para demais eventos. Mas nos consulte!" },
      { q: "A decoração está inclusa no pacote?", a: "Depende do pacote escolhido. Temos opções que incluem decoração completa e opções de assessoria apenas." },
      { q: "Trabalham com espaços próprios?", a: "Realizamos eventos em qualquer local: salões, sítios, haras, clubes ou residências." },
      { q: "Como funciona o Day Off?", a: "Estamos presentes no dia do evento para coordenar todos os fornecedores para que você só precise ser feliz." },
      { q: "Como solicitar um orçamento?", a: "Clique no WhatsApp e nos conte o tipo de evento, data prevista e número de convidados." },
      { q: "Vocês fornecem lista de fornecedores indicados?", a: "Sim! Temos parceiros de confiança em fotografia, buffet, DJ, floricultura e muito mais." },
    ],
    testimonials: [
      { initials: "JS", name: "Juliana & Sérgio", text: "Nosso casamento foi um sonho! Cada detalhe foi executado com perfeição. Choramos de emoção e gratidão." },
      { initials: "ML", name: "Mariana Lima", text: "A festa de 15 anos da minha filha superou tudo que imaginávamos. Mágico do começo ao fim!" },
      { initials: "TC", name: "Thiago Costa", text: "A confraternização da empresa foi um sucesso total. Organização impecável e ambiente incrível." },
    ],
    heroTitle: (_e, _n, cidade) => `Eventos Inesquecíveis em ${cidade}`,
    heroSub: "Planejamento e assessoria para seu evento ser exatamente como você sempre sonhou.",
    ctaUrgency: "Datas 2025 quase esgotadas! Fale conosco agora para garantir a sua data.",
    footerHours: "Seg–Sex: 9h às 18h | Sáb com agendamento | Plantão: WhatsApp",
  },

  fisioterapia: {
    primary: "#06b6d4", primaryDark: "#0e7490",
    bg: "#06100f", card: "#0e1a19",
    services: [
      { icon: "🦴", name: "Fisioterapia Ortopédica", desc: "Recuperação de lesões e pós-cirúrgico com protocolo individualizado." },
      { icon: "🏃", name: "Fisioterapia Esportiva", desc: "Prevenção e reabilitação de atletas de todos os níveis." },
      { icon: "🧠", name: "RPG & Postura", desc: "Correção postural e alívio de dores crônicas." },
      { icon: "🌸", name: "Pilates Clínico", desc: "Fortalecimento e reequilíbrio muscular supervisionado." },
      { icon: "⚡", name: "TENS & Eletroterapia", desc: "Recursos físicos para aliviar dores agudas e crônicas." },
      { icon: "💆", name: "Drenagem Linfática", desc: "Redução de edemas e melhora da circulação." },
    ],
    differentials: [
      { icon: "📋", title: "Avaliação Individualizada", desc: "Anamnese detalhada antes de qualquer tratamento." },
      { icon: "🔬", title: "Técnicas Atualizadas", desc: "Protocolos baseados em evidências científicas atuais." },
      { icon: "📈", title: "Evolução Documentada", desc: "Acompanhamos sua melhora com registros a cada sessão." },
    ],
    faqs: [
      { q: "Preciso de encaminhamento médico?", a: "Não é obrigatório, mas se tiver laudo ou exames, traga na consulta inicial para um tratamento mais preciso." },
      { q: "Quantas sessões precisarei?", a: "Depende do quadro. Avaliamos na primeira consulta e traçamos um plano realista de sessões." },
      { q: "O plano de saúde cobre?", a: "Verificamos seu convênio na hora do agendamento. Trabalhamos com os principais planos de saúde." },
      { q: "A primeira consulta é de avaliação?", a: "Sim! A primeira sessão é dedicada à avaliação completa e elaboração do plano de tratamento." },
      { q: "Como agendar?", a: "Pelo WhatsApp! Clique no botão abaixo, informe sua queixa e agendamos no melhor horário." },
      { q: "Atendem crianças?", a: "Sim! Temos fisioterapeuta especializado em fisioterapia pediátrica e neurológica infantil." },
    ],
    testimonials: [
      { initials: "VG", name: "Valeria Guimarães", text: "Sofria com dor lombar há 3 anos. Em 2 meses de fisioterapia me curei totalmente. Milagre!" },
      { initials: "FP", name: "Felipe Pereira", text: "Recuperei 100% após cirurgia no joelho. Profissional competente e acolhedor em cada sessão." },
      { initials: "RL", name: "Renata Lopes", text: "O Pilates Clínico transformou minha postura e acabou com minhas dores cervicais. Indico sempre!" },
    ],
    heroTitle: (_e, _n, cidade) => `Recupere Sua Qualidade de Vida em ${cidade}`,
    heroSub: "Fisioterapia especializada para eliminar sua dor e recuperar seus movimentos.",
    ctaUrgency: "Avaliação gratuita disponível! Não deixe a dor dominar sua vida — agende agora.",
    footerHours: "Seg–Sex: 7h às 19h | Sáb: 8h às 12h",
  },

  estetica: {
    primary: "#ec4899", primaryDark: "#be185d",
    bg: "#100812", card: "#1a0e1c",
    services: [
      { icon: "✨", name: "Limpeza de Pele", desc: "Pele revitalizada, sem cravos e brilhante." },
      { icon: "💉", name: "Toxina Botulínica", desc: "Rugas suavizadas com resultado natural e elegante." },
      { icon: "🔬", name: "Radiofrequência", desc: "Firmeza e rejuvenescimento sem cirurgia." },
      { icon: "🌿", name: "Peeling Químico", desc: "Renovação celular para manchas e textura." },
      { icon: "💆", name: "Massagem Modeladora", desc: "Redução de medidas e celulite localizada." },
      { icon: "💎", name: "Protocolo Rejuvenescimento", desc: "Combinação de técnicas para pele 10 anos mais jovem." },
    ],
    differentials: [
      { icon: "🩺", title: "Procedimentos Seguros", desc: "Realizados por profissionais habilitados com produtos certificados." },
      { icon: "📊", title: "Avaliação Personalizada", desc: "Protocolo específico para o seu tipo de pele e objetivos." },
      { icon: "✅", title: "Resultados Visíveis", desc: "Fotodocumentação antes e depois para acompanhar a evolução." },
    ],
    faqs: [
      { q: "A toxina botulínica dói?", a: "A sensação é mínima — usamos anestésico tópico antes da aplicação para máximo conforto." },
      { q: "Com que frequência devo fazer limpeza de pele?", a: "Recomendamos a cada 30 a 60 dias, dependendo do tipo de pele." },
      { q: "Em quanto tempo vejo resultado na radiofrequência?", a: "Os resultados aparecem progressivamente em 4 a 8 sessões, com melhora notável já a partir da 3ª." },
      { q: "Os procedimentos têm contraindicações?", a: "Fazemos uma anamnese completa antes de qualquer procedimento para garantir sua segurança total." },
      { q: "Como agendar uma avaliação?", a: "Clique no WhatsApp para agendar sua avaliação gratuita de pele. Sem compromisso!" },
      { q: "Posso combinar procedimentos?", a: "Sim! Montamos protocolos combinados para resultados mais completos e duradouros." },
    ],
    testimonials: [
      { initials: "NA", name: "Nathalia Azevedo", text: "Fiz o protocolo rejuvenescimento e simplesmente não acreditei no resultado. Minha pele está incrível aos 45 anos!" },
      { initials: "LP", name: "Larissa Pinto", text: "A toxina ficou super natural. Todo mundo notou que eu parecia mais jovem mas ninguém sabia o que eu tinha feito!" },
      { initials: "MR", name: "Marina Ramos", text: "Em 6 sessões de radiofrequência a flacidez melhorou muito. Profissional atenciosa e ambiente impecável." },
    ],
    heroTitle: (_e, _n, cidade) => `Beleza e Estética de Excelência em ${cidade}`,
    heroSub: "Tratamentos estéticos avançados para uma pele radiante e rejuvenescida.",
    ctaUrgency: "Agenda quase cheia! Garanta sua avaliação gratuita antes que esgotem as vagas.",
    footerHours: "Seg–Sex: 9h às 19h | Sáb: 9h às 15h",
  },
};

function matchNicho(nicho: string): NichoConfig {
  const lower = nicho.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (lower.includes("barbearia") || lower.includes("barber")) return NICHO_MAP.barbearia!;
  if (lower.includes("salao") || lower.includes("salon") || lower.includes("beleza")) return NICHO_MAP.salao!;
  if (lower.includes("dent") || lower.includes("odonto")) return NICHO_MAP.dentista!;
  if (lower.includes("psicologo") || lower.includes("psicologa") || lower.includes("psicolog") || lower.includes("terapeu")) return NICHO_MAP.psicologo!;
  if (lower.includes("nutri")) return NICHO_MAP.nutricionista!;
  if (lower.includes("academia") || lower.includes("gym") || lower.includes("fitness")) return NICHO_MAP.academia!;
  if (lower.includes("veterinar") || lower.includes("pet shop") || lower.includes("pet ")) return NICHO_MAP.veterinario!;
  if (lower.includes("advogado") || lower.includes("advocacia") || lower.includes("juridic")) return NICHO_MAP.advogado!;
  if (lower.includes("restaurante") || lower.includes("lanchonete") || lower.includes("comida") || lower.includes("gastrono")) return NICHO_MAP.restaurante!;
  if (lower.includes("foto") || lower.includes("fotograf")) return NICHO_MAP.fotografia!;
  if (lower.includes("oficina") || lower.includes("mecanica") || lower.includes("mecanico") || lower.includes("automovel")) return NICHO_MAP.oficina!;
  if (lower.includes("arquite") || lower.includes("design de interior")) return NICHO_MAP.arquiteto!;
  if (lower.includes("escola") || lower.includes("idioma") || lower.includes("ingles") || lower.includes("curso")) return NICHO_MAP.escola!;
  if (lower.includes("personal") || lower.includes("treinador")) return NICHO_MAP.personal!;
  if (lower.includes("cerimonia") || lower.includes("evento") || lower.includes("casamento")) return NICHO_MAP.cerimonialista!;
  if (lower.includes("fisio")) return NICHO_MAP.fisioterapia!;
  if (lower.includes("estetic") || lower.includes("beleza") || lower.includes("clinica est")) return NICHO_MAP.estetica!;

  // Default fallback
  return NICHO_MAP.arquiteto!;
}

export function generateDemoHtml(lead: LeadInfo): string {
  const cfg = matchNicho(lead.nicho);
  const phone = (lead.whatsapp || lead.telefone || "").replace(/\D/g, "");
  const waNumber = phone.length >= 10 ? `55${phone}` : "5511999999999";
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Olá! Vi o site da ${lead.nomeEmpresa} e gostaria de saber mais.`)}`;
  const heroTitle = cfg.heroTitle(lead.nomeEmpresa, lead.nicho, lead.cidade);
  const year = new Date().getFullYear();

  const servicesHtml = cfg.services.map(s => `
    <div style="background:${cfg.card};border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;transition:transform .2s,box-shadow .2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,.4)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="font-size:2.2rem;margin-bottom:12px">${s.icon}</div>
      <h3 style="color:#fff;font-size:1.05rem;font-weight:700;margin:0 0 8px">${s.name}</h3>
      <p style="color:rgba(255,255,255,.6);font-size:.875rem;margin:0;line-height:1.6">${s.desc}</p>
    </div>`).join("");

  const diffsHtml = cfg.differentials.map(d => `
    <div style="display:flex;gap:20px;align-items:flex-start;padding:24px;background:${cfg.card};border:1px solid rgba(255,255,255,.08);border-radius:16px">
      <div style="width:52px;height:52px;border-radius:14px;background:${cfg.primary}22;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">${d.icon}</div>
      <div>
        <h3 style="color:#fff;font-size:1rem;font-weight:700;margin:0 0 6px">${d.title}</h3>
        <p style="color:rgba(255,255,255,.6);font-size:.875rem;margin:0;line-height:1.6">${d.desc}</p>
      </div>
    </div>`).join("");

  const faqsHtml = cfg.faqs.map((f, i) => `
    <div style="border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden">
      <button onclick="toggleFaq(${i})" style="width:100%;padding:20px 24px;background:${cfg.card};border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;text-align:left;gap:16px">
        <span style="color:#fff;font-size:.95rem;font-weight:600">${f.q}</span>
        <span id="faq-icon-${i}" style="color:${cfg.primary};font-size:1.4rem;flex-shrink:0;transition:transform .3s">+</span>
      </button>
      <div id="faq-body-${i}" style="max-height:0;overflow:hidden;transition:max-height .35s ease">
        <p style="padding:0 24px 20px;color:rgba(255,255,255,.7);font-size:.875rem;line-height:1.7;margin:0">${f.a}</p>
      </div>
    </div>`).join("");

  const testimonialsHtml = cfg.testimonials.map(t => `
    <div style="background:${cfg.card};border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px 24px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="width:48px;height:48px;border-radius:50%;background:${cfg.primary};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;color:#fff;flex-shrink:0">${t.initials}</div>
        <div>
          <p style="color:#fff;font-weight:700;font-size:.95rem;margin:0">${t.name}</p>
          <p style="color:${cfg.primary};font-size:.8rem;margin:4px 0 0">⭐⭐⭐⭐⭐</p>
        </div>
      </div>
      <p style="color:rgba(255,255,255,.75);font-size:.875rem;line-height:1.7;margin:0">"${t.text}"</p>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${lead.nicho} em ${lead.cidade} | ${lead.nomeEmpresa}</title>
<meta name="description" content="${lead.nomeEmpresa} — ${lead.nicho} em ${lead.cidade}. ${cfg.heroSub}">
<meta property="og:title" content="${lead.nicho} em ${lead.cidade} | ${lead.nomeEmpresa}">
<meta property="og:description" content="${cfg.heroSub}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:${cfg.bg};color:#fff;line-height:1.6}
.container{max-width:1180px;margin:0 auto;padding:0 24px}
.btn-primary{display:inline-flex;align-items:center;gap:10px;background:${cfg.primary};color:#fff;padding:16px 32px;border-radius:50px;font-weight:700;font-size:1rem;text-decoration:none;border:none;cursor:pointer;transition:background .2s,transform .2s,box-shadow .2s}
.btn-primary:hover{background:${cfg.primaryDark};transform:translateY(-2px);box-shadow:0 8px 24px ${cfg.primary}66}
.btn-outline{display:inline-flex;align-items:center;gap:10px;background:transparent;color:#fff;padding:14px 28px;border-radius:50px;font-weight:600;font-size:1rem;text-decoration:none;border:2px solid rgba(255,255,255,.35);cursor:pointer;transition:all .2s}
.btn-outline:hover{border-color:rgba(255,255,255,.7);background:rgba(255,255,255,.08)}
.btn-wpp{display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;padding:16px 32px;border-radius:50px;font-weight:700;font-size:1rem;text-decoration:none;border:none;cursor:pointer;transition:background .2s,transform .2s,box-shadow .2s}
.btn-wpp:hover{background:#1da851;transform:translateY(-2px);box-shadow:0 8px 24px #25D36666}
.section{padding:96px 0}
.section-alt{background:rgba(255,255,255,.025)}
.section-title{text-align:center;margin-bottom:56px}
.section-title h2{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:800;color:#fff;margin-bottom:12px}
.section-title p{color:rgba(255,255,255,.6);font-size:1.05rem;max-width:600px;margin:0 auto}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
.badge{display:inline-flex;align-items:center;gap:6px;background:${cfg.primary}22;color:${cfg.primary};border:1px solid ${cfg.primary}44;padding:6px 16px;border-radius:50px;font-size:.8rem;font-weight:700;margin-bottom:20px}
header{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 0;transition:background .3s,box-shadow .3s}
header.scrolled{background:${cfg.bg}ee;backdrop-filter:blur(12px);box-shadow:0 2px 24px rgba(0,0,0,.4)}
header .header-inner{display:flex;align-items:center;justify-content:space-between;gap:16px}
header .logo{font-size:1.3rem;font-weight:900;color:#fff;text-decoration:none}
header nav{display:flex;align-items:center;gap:24px}
header nav a{color:rgba(255,255,255,.75);text-decoration:none;font-size:.9rem;font-weight:500;transition:color .2s}
header nav a:hover{color:#fff}
.hero{padding:160px 0 100px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 60% 40%,${cfg.primary}18,transparent 70%)}
.hero-content{position:relative;z-index:1;max-width:780px}
.hero h1{font-size:clamp(2.2rem,5vw,3.6rem);font-weight:900;line-height:1.15;margin-bottom:20px;letter-spacing:-.02em}
.hero h1 span{color:${cfg.primary}}
.hero p{font-size:1.15rem;color:rgba(255,255,255,.75);max-width:560px;margin-bottom:36px;line-height:1.7}
.hero-btns{display:flex;flex-wrap:wrap;gap:14px}
.hero-stats{display:flex;flex-wrap:wrap;gap:32px;margin-top:52px;padding-top:40px;border-top:1px solid rgba(255,255,255,.1)}
.hero-stat{display:flex;flex-direction:column}
.hero-stat span:first-child{font-size:1.8rem;font-weight:900;color:${cfg.primary}}
.hero-stat span:last-child{font-size:.825rem;color:rgba(255,255,255,.5)}
.cta-section{padding:80px 0;background:linear-gradient(135deg,${cfg.primary}22,${cfg.primaryDark}15)}
.cta-section .cta-box{text-align:center;max-width:720px;margin:0 auto}
.cta-section h2{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;margin-bottom:16px}
.cta-section p{color:rgba(255,255,255,.7);font-size:1.05rem;margin-bottom:36px;line-height:1.7}
footer{padding:48px 0;border-top:1px solid rgba(255,255,255,.08)}
footer .footer-inner{display:flex;flex-wrap:wrap;gap:32px;justify-content:space-between;align-items:center}
footer .footer-name{font-size:1.1rem;font-weight:800;color:#fff}
footer p{color:rgba(255,255,255,.45);font-size:.825rem}
footer .footer-links{display:flex;gap:16px}
footer .footer-links a{color:rgba(255,255,255,.55);text-decoration:none;font-size:.85rem;transition:color .2s}
footer .footer-links a:hover{color:#fff}
.demo-badge{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);border:1px solid rgba(255,255,255,.2);border-radius:50px;padding:10px 20px;font-size:.75rem;color:rgba(255,255,255,.6);backdrop-filter:blur(8px);z-index:1000;white-space:nowrap}
@media(max-width:768px){
  header nav{display:none}
  .hero{padding:120px 0 80px}
  .hero-stats{gap:24px}
  .grid-2,.grid-3{grid-template-columns:1fr}
}
</style>
</head>
<body>

<!-- Header -->
<header id="header">
  <div class="container">
    <div class="header-inner">
      <a href="#" class="logo">${lead.nomeEmpresa}</a>
      <nav>
        <a href="#servicos">Serviços</a>
        <a href="#depoimentos">Depoimentos</a>
        <a href="#faq">FAQ</a>
        <a href="#contato">Contato</a>
      </nav>
      <a href="${waUrl}" target="_blank" class="btn-wpp" style="padding:10px 20px;font-size:.875rem">
        💬 WhatsApp
      </a>
    </div>
  </div>
</header>

<!-- Hero -->
<section class="hero">
  <div class="container">
    <div class="hero-content">
      <div class="badge">⭐ Mais de 500 clientes satisfeitos</div>
      <h1>${heroTitle.replace(lead.cidade, `<span>${lead.cidade}</span>`)}</h1>
      <p>${cfg.heroSub}</p>
      <div class="hero-btns">
        <a href="${waUrl}" target="_blank" class="btn-wpp">💬 Agendar Agora</a>
        <a href="#servicos" class="btn-outline">Ver Serviços</a>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><span>500+</span><span>Clientes atendidos</span></div>
        <div class="hero-stat"><span>98%</span><span>Satisfação</span></div>
        <div class="hero-stat"><span>5★</span><span>Avaliação média</span></div>
        <div class="hero-stat"><span>5+</span><span>Anos de experiência</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Diferenciais -->
<section class="section section-alt">
  <div class="container">
    <div class="section-title">
      <h2>Por que escolher a <span style="color:${cfg.primary}">${lead.nomeEmpresa}</span>?</h2>
      <p>Nossa missão é superar suas expectativas em cada atendimento.</p>
    </div>
    <div class="grid-2" style="gap:20px">${diffsHtml}</div>
  </div>
</section>

<!-- Serviços -->
<section class="section" id="servicos">
  <div class="container">
    <div class="section-title">
      <h2>Nossos Serviços</h2>
      <p>Soluções completas para todas as suas necessidades.</p>
    </div>
    <div class="grid-3">${servicesHtml}</div>
  </div>
</section>

<!-- Depoimentos -->
<section class="section section-alt" id="depoimentos">
  <div class="container">
    <div class="section-title">
      <h2>O que nossos clientes dizem</h2>
      <p>Resultados reais de quem já confou na ${lead.nomeEmpresa}.</p>
    </div>
    <div class="grid-3">${testimonialsHtml}</div>
  </div>
</section>

<!-- FAQ -->
<section class="section" id="faq">
  <div class="container">
    <div class="section-title">
      <h2>Perguntas Frequentes</h2>
      <p>Tire suas dúvidas antes de entrar em contato.</p>
    </div>
    <div style="max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
      ${faqsHtml}
    </div>
  </div>
</section>

<!-- CTA Final -->
<section class="cta-section" id="contato">
  <div class="container">
    <div class="cta-box">
      <h2>Pronto para começar?</h2>
      <p>${cfg.ctaUrgency}</p>
      <a href="${waUrl}" target="_blank" class="btn-wpp" style="font-size:1.1rem;padding:18px 40px">
        💬 Falar no WhatsApp agora
      </a>
    </div>
  </div>
</section>

<!-- Footer -->
<footer>
  <div class="container">
    <div class="footer-inner">
      <div>
        <div class="footer-name">${lead.nomeEmpresa}</div>
        <p style="margin-top:6px">${lead.cidade} · ${cfg.footerHours}</p>
      </div>
      <div class="footer-links">
        <a href="${waUrl}" target="_blank">WhatsApp</a>
        <a href="#">Instagram</a>
        <a href="#">Google Maps</a>
      </div>
    </div>
    <p style="margin-top:24px;text-align:center">© ${year} ${lead.nomeEmpresa}. Todos os direitos reservados.</p>
  </div>
</footer>

<!-- Demo badge -->
<div class="demo-badge">🚀 Demonstração — ProspectaLP</div>

<script>
// Header scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

// FAQ accordion
const faqStates = {};
function toggleFaq(i) {
  const body = document.getElementById('faq-body-' + i);
  const icon = document.getElementById('faq-icon-' + i);
  const isOpen = faqStates[i];
  // Close all
  document.querySelectorAll('[id^="faq-body-"]').forEach((el, j) => {
    el.style.maxHeight = '0';
    const ic = document.getElementById('faq-icon-' + j);
    if (ic) { ic.textContent = '+'; ic.style.transform = ''; }
    faqStates[j] = false;
  });
  // Open clicked if was closed
  if (!isOpen) {
    body.style.maxHeight = body.scrollHeight + 'px';
    icon.textContent = '−';
    icon.style.transform = 'rotate(0deg)';
    faqStates[i] = true;
  }
}

// Smooth reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section .container > *:not(.section-title)').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  observer.observe(el);
});
</script>
</body>
</html>`;
}
