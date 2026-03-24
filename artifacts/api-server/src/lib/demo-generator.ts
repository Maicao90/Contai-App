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

  energiasolar: {
    primary: "#f59e0b", primaryDark: "#d97706",
    bg: "#0a0700", card: "#181100",
    services: [
      { icon: "☀️", name: "Instalação Residencial", desc: "Kit solar completo para sua casa com máxima eficiência e ROI garantido." },
      { icon: "🏭", name: "Instalação Comercial", desc: "Soluções de grande porte para empresas, indústrias e condomínios." },
      { icon: "📐", name: "Dimensionamento Gratuito", desc: "Projeto personalizado baseado no seu consumo real, sem custo." },
      { icon: "📋", name: "Homologação ANEEL", desc: "Toda burocracia com a distribuidora cuidamos nós — 100% sem estresse." },
      { icon: "🔧", name: "Manutenção Preventiva", desc: "Revisões periódicas para manter sua geração no máximo desempenho." },
      { icon: "💳", name: "Financiamento Facilitado", desc: "Parcelas menores que sua conta de luz atual. Economia desde o 1º mês." },
    ],
    differentials: [
      { icon: "⚡", title: "Economia de até 95%", desc: "Reduza sua conta de luz drasticamente e recupere o investimento em até 4 anos." },
      { icon: "🏆", title: "Instaladores Certificados", desc: "Equipe com certificação NABCEP e treinamento contínuo pelos fabricantes." },
      { icon: "🔒", title: "Garantia de 25 Anos", desc: "Painéis com 25 anos de garantia de performance e 10 anos no serviço." },
    ],
    faqs: [
      { q: "Em quanto tempo o sistema se paga?", a: "Entre 3 e 5 anos dependendo do consumo — depois disso é pura economia, por mais 20 anos." },
      { q: "Funciona em dias nublados?", a: "Sim! Os painéis geram energia com luz difusa. Dias nublados reduzem a geração em ~30%, não zeram." },
      { q: "Como funciona a homologação na distribuidora?", a: "Cuidamos de todo o processo burocrático com a ANEEL e sua concessionária. Você não precisa fazer nada." },
      { q: "Qual a vida útil do sistema?", a: "Os inversores duram em média 10–15 anos; os painéis, 25–30 anos com manutenção adequada." },
      { q: "Posso instalar em imóvel alugado?", a: "É possível com autorização do proprietário. Muitos locatários negociam o custo como melhoria do imóvel." },
      { q: "Como é feito o dimensionamento?", a: "Analisamos suas contas de luz dos últimos 12 meses e geramos um projeto 100% personalizado, sem custo." },
    ],
    testimonials: [
      { initials: "RO", name: "Ricardo Oliveira", text: "Minha conta caiu de R$850 para R$47 por mês. Em 4 anos pago o sistema e depois é tudo lucro. Investimento certeiro!" },
      { initials: "FM", name: "Fernanda Machado", text: "O processo foi muito mais simples do que eu imaginava. Eles cuidaram de tudo com a concessionária e em 45 dias já estava gerando." },
      { initials: "JP", name: "João Paulo Silva", text: "Fiz na minha empresa e economizei R$4.200 por mês. Recomendo a todo empresário que ainda não tomou essa decisão." },
    ],
    heroTitle: (_e, _n, cidade) => `Energia Solar em ${cidade} — Reduza Sua Conta em até 95%`,
    heroSub: "Instalação completa com financiamento facilitado e retorno garantido. Economize desde o primeiro mês.",
    ctaUrgency: "Vagas limitadas para visita técnica gratuita este mês. Simule sua economia agora!",
    footerHours: "Seg–Sex: 8h às 18h | Sáb: 8h às 12h",
  },

  petshop: {
    primary: "#14b8a6", primaryDark: "#0f766e",
    bg: "#030f0e", card: "#071a18",
    services: [
      { icon: "🛁", name: "Banho & Tosa", desc: "Higienização completa com produtos premium e secagem profissional." },
      { icon: "🏨", name: "Pet Hotel", desc: "Hospedagem com carinho, câmeras 24h e atividades recreativas diárias." },
      { icon: "🩺", name: "Consulta Veterinária", desc: "Atendimento clínico e preventivo com médico veterinário especializado." },
      { icon: "🥩", name: "Ração Premium", desc: "Linha completa de rações super-premium, naturais e veterinárias." },
      { icon: "🎀", name: "Acessórios & Roupinhas", desc: "Coleiras, caminhas, brinquedos e moda pet para todas as ocasiões." },
      { icon: "🚗", name: "Táxi Pet", desc: "Buscamos e levamos seu pet com segurança e conforto." },
    ],
    differentials: [
      { icon: "📷", title: "Câmeras 24 horas", desc: "Acompanhe seu pet em tempo real pelo celular durante a estadia." },
      { icon: "❤️", title: "Equipe Apaixonada", desc: "Todos os colaboradores são amantes de animais e treinados em bem-estar pet." },
      { icon: "🏥", title: "Veterinário no Local", desc: "Atendimento veterinário disponível todos os dias, inclusive emergências." },
    ],
    faqs: [
      { q: "Meu pet precisa estar vacinado para usar os serviços?", a: "Sim, exigimos vacinas em dia para a segurança de todos os animais. Trazemos o cartão na primeira visita." },
      { q: "Com que frequência devo dar banho no meu pet?", a: "Para cães, geralmente a cada 15 a 30 dias. Para gatos, conforme a necessidade. Orientamos na consulta." },
      { q: "Posso acompanhar meu pet durante o banho?", a: "Preferivelmente não, pois os pets tendem a ficar mais agitados com o dono presente. Mas usamos câmeras para você ver tudo!" },
      { q: "Quais espécies vocês atendem?", a: "Cães e gatos em todos os serviços. Consulte-nos sobre aves, coelhos e outros pequenos animais." },
      { q: "O Pet Hotel tem espaço para exercícios?", a: "Sim! Temos área de recreação e cada pet tem atividade física diária supervisionada." },
      { q: "Como marco um horário?", a: "Pelo WhatsApp! É rápido e você já sai com a confirmação na hora." },
    ],
    testimonials: [
      { initials: "CA", name: "Camila Andrade", text: "Meu Golden fica no Pet Hotel sempre que viajo. As câmeras são maravilhosas — fica mais fácil viajar sabendo que ele está bem!" },
      { initials: "TR", name: "Thiago Rodrigues", text: "A tosa ficou impecável e meu Shih Tzu adorou. Equipe super cuidadosa e carinhosa com os pets. Nunca mais vou a outro lugar!" },
      { initials: "LF", name: "Letícia Ferreira", text: "Minha gata estava com problema de saúde e o veterinário do pet shop resolveu tudo rapidamente. Atendimento excelente!" },
    ],
    heroTitle: (_e, _n, cidade) => `O Melhor Pet Shop de ${cidade} — Seu Pet Merece o Melhor`,
    heroSub: "Banho, tosa, veterinário e hotel para pets. Cuidado e amor em cada serviço.",
    ctaUrgency: "Agende o banho & tosa agora e ganhe um mimo especial para o seu pet!",
    footerHours: "Seg–Sáb: 8h às 19h | Dom: 9h às 13h",
  },

  contabilidade: {
    primary: "#3b82f6", primaryDark: "#1d4ed8",
    bg: "#030810", card: "#07111e",
    services: [
      { icon: "🏢", name: "Abertura de Empresa", desc: "MEI, ME, LTDA, S.A. — abrimos sua empresa do jeito certo e no menor prazo." },
      { icon: "📊", name: "Contabilidade Mensal", desc: "Escrituração, balancetes e relatórios gerenciais para tomada de decisão." },
      { icon: "📝", name: "Imposto de Renda PF", desc: "Declaração anual do IRPF com atenção a todas as deduções legais." },
      { icon: "👥", name: "Folha de Pagamento", desc: "eSocial, pró-labore, FGTS e férias — tudo no prazo e sem multas." },
      { icon: "⚖️", name: "Planejamento Tributário", desc: "Redução legal de impostos com análise do melhor regime tributário." },
      { icon: "💼", name: "BPO Financeiro", desc: "Gestão financeira terceirizada para você focar no crescimento." },
    ],
    differentials: [
      { icon: "💰", title: "Economia Real em Impostos", desc: "Clientes economizam em média 22% em carga tributária com nosso planejamento." },
      { icon: "💻", title: "100% Digital", desc: "Sem papelada. Documentos, relatórios e comunicação tudo online e organizado." },
      { icon: "🎯", title: "Especialistas por Segmento", desc: "Contadores especializados no seu ramo de atividade para orientação precisa." },
    ],
    faqs: [
      { q: "Qual o melhor regime tributário para minha empresa?", a: "Depende do faturamento, atividade e margem. Fazemos uma análise gratuita para recomendar Simples, Lucro Presumido ou Real." },
      { q: "Vocês atendem MEI?", a: "Sim! Temos planos especiais para MEI com preço acessível e suporte para crescer até ME ou LTDA." },
      { q: "Posso trocar de contador no meio do ano?", a: "Pode e é mais simples do que parece. Cuidamos de toda a transferência da documentação." },
      { q: "Em quanto tempo abrem minha empresa?", a: "Em geral entre 3 e 10 dias úteis dependendo do município e da atividade." },
      { q: "Como envio os documentos?", a: "100% digital — por aplicativo, WhatsApp ou e-mail. Sem necessidade de ir pessoalmente." },
      { q: "Vocês dão suporte em fiscalizações?", a: "Sim. Em caso de notificações da Receita Federal ou SEFAZ, nossa equipe assume a resposta." },
    ],
    testimonials: [
      { initials: "GN", name: "Gustavo Neves", text: "Economizei R$1.800/mês mudando de regime tributário com a orientação deles. Deveria ter feito isso anos atrás!" },
      { initials: "AB", name: "Ana Beatriz Lima", text: "Abriram minha empresa em 6 dias. Processo todo digital e sem dor de cabeça. Atendimento super atencioso." },
      { initials: "MF", name: "Marcos Figueiredo", text: "Tenho 3 CNPJs e eles cuidam de tudo. Nunca mais me preocupo com prazo de obrigações fiscais." },
    ],
    heroTitle: (_e, _n, cidade) => `Contabilidade Digital em ${cidade} — Pague Menos Imposto, Legalmente`,
    heroSub: "Especialistas em planejamento tributário, abertura de empresas e contabilidade gerencial para PMEs.",
    ctaUrgency: "Faça uma análise tributária gratuita e descubra quanto sua empresa pode economizar por mês.",
    footerHours: "Seg–Sex: 8h às 18h",
  },

  imobiliaria: {
    primary: "#10b981", primaryDark: "#059669",
    bg: "#031008", card: "#061d0f",
    services: [
      { icon: "🏠", name: "Compra de Imóveis", desc: "Encontramos o imóvel dos seus sonhos com curadoria personalizada." },
      { icon: "💰", name: "Venda Rápida", desc: "Estratégia de precificação e marketing para vender no menor prazo." },
      { icon: "🔑", name: "Locação", desc: "Administração completa: inquilinos, contratos, cobranças e manutenções." },
      { icon: "🏗️", name: "Lançamentos", desc: "Acesso exclusivo a lançamentos de incorporadoras parceiras." },
      { icon: "🏦", name: "Financiamento", desc: "Simulação e assessoria para aprovação de crédito no melhor banco." },
      { icon: "⚖️", name: "Assessoria Jurídica", desc: "Contratos, distratos e documentação com total segurança jurídica." },
    ],
    differentials: [
      { icon: "🗺️", title: "Especialistas na Região", desc: "Conhecimento profundo do mercado local para a melhor negociação." },
      { icon: "📱", title: "Atendimento Ágil", desc: "Resposta rápida, visitas flexíveis e processo 100% digital e transparente." },
      { icon: "🤝", title: "Negociação Especializada", desc: "Corretores com expertise em fechamento para você pagar menos ou vender mais." },
    ],
    faqs: [
      { q: "Qual é a comissão do corretor?", a: "A comissão é de 6% sobre o valor de venda, padrão CRECI, paga somente quando o negócio fechar." },
      { q: "Quanto tempo leva para vender um imóvel?", a: "Depende do preço e localização, mas nossa estratégia de marketing reduz o prazo médio para 45 dias." },
      { q: "Vocês administram aluguel?", a: "Sim! Cuidamos de tudo: anúncio, seleção de inquilinos, contratos, cobranças e vistorias." },
      { q: "Posso financiar 100% do imóvel?", a: "Geralmente até 80% do valor. Fazemos simulação gratuita para você saber exatamente as condições." },
      { q: "Preciso de advogado para comprar um imóvel?", a: "Nossa assessoria jurídica está incluída. Analisamos toda documentação para garantir segurança total." },
      { q: "Como avaliam o valor do meu imóvel?", a: "Fazemos um laudo baseado em comparativos de mercado e visita técnica, sem custo para o proprietário." },
    ],
    testimonials: [
      { initials: "PB", name: "Paulo Braga", text: "Vendi meu apartamento em 38 dias por R$30k acima do que eu esperava. Estratégia de divulgação impecável!" },
      { initials: "IS", name: "Isabela Santos", text: "Me ajudaram a financiar meu primeiro imóvel, processo que eu achava impossível. Toda orientação foi clarissíma." },
      { initials: "CE", name: "Carlos Eduardo", text: "Coloquei para alugar e nunca mais me preocupei. Eles cuidam de tudo e o aluguel cai certinho todo mês." },
    ],
    heroTitle: (_e, _n, cidade) => `Imobiliária em ${cidade} — Compre, Venda ou Alugue com Segurança`,
    heroSub: "Corretores especializados no mercado local para você fechar o melhor negócio imobiliário.",
    ctaUrgency: "Fale agora com um corretor e receba uma avaliação gratuita do seu imóvel!",
    footerHours: "Seg–Sex: 8h às 18h | Sáb: 8h às 13h",
  },

  hamburgueria: {
    primary: "#ef4444", primaryDark: "#dc2626",
    bg: "#0d0200", card: "#1a0400",
    services: [
      { icon: "🍔", name: "Smash Burger", desc: "Blend de carnes frescos, amassados na chapa, com crosta crocante e suculência incrível." },
      { icon: "🥓", name: "Burger Especial", desc: "Receitas exclusivas da casa com ingredientes premium e molhos artesanais." },
      { icon: "🌱", name: "Veggie Burger", desc: "Opções vegetarianas e veganas sem abrir mão do sabor intenso." },
      { icon: "🍟", name: "Batatas & Sides", desc: "Batatas artesanais, onion rings e sides que fazem o combo perfeito." },
      { icon: "🎉", name: "Combos & Promos", desc: "Combos que cabem no bolso sem economizar no tamanho ou no sabor." },
      { icon: "🛵", name: "Delivery Rápido", desc: "Pedido pelo WhatsApp ou app — entregamos quentinho até você." },
    ],
    differentials: [
      { icon: "🥩", title: "Carne Fresca Todo Dia", desc: "Blend de carnes moídas diariamente, nunca congeladas. Sabor incomparável." },
      { icon: "🧪", title: "Molhos Artesanais", desc: "Molhos exclusivos preparados na casa para elevar cada mordida." },
      { icon: "⚡", title: "Pronto em 15 Minutos", desc: "Da ordem à entrega em até 15 minutos. Sem espera, sem desculpa." },
    ],
    faqs: [
      { q: "A carne é fresca ou congelada?", a: "100% fresca! Moemos e temperamos diariamente para garantir máximo sabor e suculência." },
      { q: "Vocês têm opção sem glúten?", a: "Sim! Temos pão sem glúten e ingredientes sem glúten disponíveis. Consulte ao pedir." },
      { q: "Fazem delivery?", a: "Sim! Entregamos pelo WhatsApp, iFood e nosso app. Embalagem especial para o burger chegar perfeito." },
      { q: "Posso montar meu próprio burger?", a: "Claro! Temos um monte your own com mais de 20 ingredientes para você customizar." },
      { q: "Qual o tamanho das porções?", a: "Burgers de 150g a 300g de carne. Para quem tem muito apetite, temos o desafio XL!" },
      { q: "Fazem festas e eventos corporativos?", a: "Sim! Montamos estrutura de burger no local para seu evento. Fale no WhatsApp para orçamento." },
    ],
    testimonials: [
      { initials: "EG", name: "Eduardo Gomes", text: "O melhor smash burger que já comi na vida. Carne suculenta, molho incrível, pão macio. Virou meu lugar favorito!" },
      { initials: "VL", name: "Vanessa Lima", text: "Fui só uma vez e já sou fã. O atendimento é ótimo e o tempo de espera é zero. Perfeito para o almoço!" },
      { initials: "DS", name: "Diego Souza", text: "Fiz o evento da minha empresa com eles e foi um sucesso absoluto. Todo mundo pediu o contato no final." },
    ],
    heroTitle: (_e, _n, cidade) => `A Melhor Hamburgueria Artesanal de ${cidade}`,
    heroSub: "Smash burgers com carne fresca, molhos artesanais e ingredientes premium. Delivery rápido.",
    ctaUrgency: "Peça agora pelo WhatsApp e receba em até 30 minutos com desconto na primeira compra!",
    footerHours: "Seg–Sex: 11h às 23h | Sáb–Dom: 11h às 00h",
  },

  padaria: {
    primary: "#f59e0b", primaryDark: "#d97706",
    bg: "#0d0800", card: "#1a1300",
    services: [
      { icon: "🥖", name: "Pães Artesanais", desc: "Fermentação natural, grãos integrais e receitas tradicionais feitas todo dia." },
      { icon: "🎂", name: "Bolos Personalizados", desc: "Bolos de aniversário, casamento e datas especiais com decoração exclusiva." },
      { icon: "🥐", name: "Café da Manhã", desc: "Croissants, brioches, pão de queijo e tudo para começar o dia bem." },
      { icon: "🥧", name: "Salgados & Tortas", desc: "Salgados assados e fritos, coxinhas e tortas para festas e eventos." },
      { icon: "📦", name: "Cestas & Kits", desc: "Cestas de café da manhã e kits especiais para presentear com gostinho caseiro." },
      { icon: "🚚", name: "Entrega em Casa", desc: "Pão fresquinho na sua porta todo dia de manhã. Assine e economize." },
    ],
    differentials: [
      { icon: "🌾", title: "Ingredientes Naturais", desc: "Sem conservantes artificiais. Tudo feito com ingredientes frescos e de qualidade." },
      { icon: "⏰", title: "Forno 4h da Manhã", desc: "Pão quentinho e fresquinho disponível desde cedo, sem exceção." },
      { icon: "❤️", title: "Receita de Família", desc: "Tradição de décadas passada de geração em geração com muito carinho." },
    ],
    faqs: [
      { q: "Os pães têm conservantes?", a: "Não! Usamos apenas ingredientes naturais, sem conservantes ou aditivos artificiais." },
      { q: "Fazem bolos para casamento?", a: "Sim! Temos linha para festas e casamentos com degustação gratuita previamente." },
      { q: "Posso encomendar com antecedência?", a: "Claro! Recomendamos encomendas com 48h de antecedência para garantir disponibilidade." },
      { q: "Vocês entregam em casa?", a: "Sim! Temos plano de assinatura semanal e entrega diária. Fale no WhatsApp para ativar." },
      { q: "Qual o horário de funcionamento?", a: "Abrimos às 6h para você não perder o pão fresquinho de manhã!" },
      { q: "Fazem pão sem glúten?", a: "Sim! Temos linha especial para celíacos e intolerantes, feita em área separada." },
    ],
    testimonials: [
      { initials: "SC", name: "Sandra Costa", text: "Desde que descobri essa padaria, não consigo mais comer pão de outro lugar. Sabor incomparável!" },
      { initials: "MH", name: "Mariana Henrique", text: "O bolo de aniversário da minha filha foi um espetáculo. Todo mundo perguntou onde eu tinha comprado!" },
      { initials: "RC", name: "Roberto Campos", text: "Assino a entrega de pão toda manhã faz 2 anos. Nunca atrasou uma vez e o pão sempre chega quentinho." },
    ],
    heroTitle: (_e, _n, cidade) => `Padaria Artesanal em ${cidade} — Pão Fresquinho Todo Dia`,
    heroSub: "Pães de fermentação natural, bolos personalizados e café da manhã feitos com ingredientes de verdade.",
    ctaUrgency: "Faça seu pedido agora e ganhe uma surpresa especial na primeira encomenda!",
    footerHours: "Seg–Sáb: 6h às 20h | Dom: 6h às 14h",
  },

  lavajato: {
    primary: "#0ea5e9", primaryDark: "#0284c7",
    bg: "#020c14", card: "#051525",
    services: [
      { icon: "🚗", name: "Lavagem Simples", desc: "Lavagem externa completa com espuma ativa, enxágue e secagem." },
      { icon: "✨", name: "Lavagem Premium", desc: "Externa + interna com aspiração, painéis e vidros impecáveis." },
      { icon: "💎", name: "Polimento Técnico", desc: "Remoção de riscos, oxidação e marcas de chuva ácida com resultado show." },
      { icon: "🔬", name: "Cristalização", desc: "Proteção de longa duração para a pintura com brilho espelhado." },
      { icon: "🪑", name: "Higienização Interna", desc: "Bancos, carpetes e teto com vapor e extratora para retirar até ácaros." },
      { icon: "🔩", name: "Polimento de Faróis", desc: "Restauração de faróis opacos para clareza e segurança total." },
    ],
    differentials: [
      { icon: "⏱️", title: "Rápido e Agendado", desc: "Serviço por agendamento para você não perder tempo esperando." },
      { icon: "🧴", title: "Produtos Premium", desc: "Usamos apenas produtos profissionais que protegem a pintura do seu carro." },
      { icon: "📸", title: "Fotos Antes e Depois", desc: "Documentamos todo serviço com fotos para você ver a transformação." },
    ],
    faqs: [
      { q: "Quanto tempo leva uma lavagem completa?", a: "Lavagem simples: 40 min. Premium: 1h30. Polimento: 4 a 6 horas. Agendamos no seu horário." },
      { q: "O polimento risca a pintura?", a: "Não! Usamos máquinas de última geração e abrasivos específicos para cada tipo de pintura." },
      { q: "A cristalização é a mesma coisa que vitrificação?", a: "São similares. Ambas protegem a pintura, mas a vitrificação dura mais. Explicamos a diferença na hora." },
      { q: "Posso trazer carro com teto solar?", a: "Sim! Higienizamos com atenção especial às vedações e calhas do teto solar." },
      { q: "Vocês fazem a domicílio?", a: "Em alguns casos sim. Consulte disponibilidade no WhatsApp." },
      { q: "Com que frequência devo polir o carro?", a: "Polimento a cada 12–18 meses. Lavagem semanal ou quinzenal para manter a pintura protegida." },
    ],
    testimonials: [
      { initials: "AR", name: "André Ribeiro", text: "Meu carro saiu como se fosse novo da concessionária. O polimento removeu riscos que eu achava permanentes!" },
      { initials: "KS", name: "Karina Sousa", text: "Higienização interna foi impressionante. Bancos de couro ficaram perfeitos e o cheiro de novo voltou." },
      { initials: "BM", name: "Bruno Moreira", text: "Nunca mais vou em outro lava jato. Atenção ao detalhe que não vi em lugar nenhum." },
    ],
    heroTitle: (_e, _n, cidade) => `Lava Jato Premium em ${cidade} — Seu Carro Merece o Melhor`,
    heroSub: "Lavagem, polimento e higienização com produtos profissionais e resultado de exposição.",
    ctaUrgency: "Agende agora e ganhe 10% de desconto na primeira visita!",
    footerHours: "Seg–Sáb: 8h às 18h | Dom: 8h às 13h",
  },

  autoescola: {
    primary: "#f97316", primaryDark: "#ea580c",
    bg: "#0d0500", card: "#1a0c00",
    services: [
      { icon: "🏍️", name: "Categoria A — Moto", desc: "Formação completa para habilitação de motocicletas com instrutores experientes." },
      { icon: "🚗", name: "Categoria B — Carro", desc: "Curso teórico e prático para habilitação de veículos de passeio." },
      { icon: "🚛", name: "Categorias C, D e E", desc: "Habilitação para caminhões, ônibus e veículos com reboque." },
      { icon: "🔄", name: "Reciclagem de CNH", desc: "Curso de reciclagem para suspensão de pontos e renovação de habilitação." },
      { icon: "📚", name: "Aulas Avulsas", desc: "Aulas práticas extras para quem quer ganhar mais confiança antes da prova." },
      { icon: "🧠", name: "Psicotécnico", desc: "Exame psicotécnico com psicólogo credenciado DETRAN direto na unidade." },
    ],
    differentials: [
      { icon: "🏆", title: "Maior Taxa de Aprovação", desc: "Acima de 95% de aprovação na primeira tentativa no exame do DETRAN." },
      { icon: "📅", title: "Horários Flexíveis", desc: "Aulas manhã, tarde e noite. Encaixamos na sua agenda sem estresse." },
      { icon: "🚦", title: "Instrutores Certificados", desc: "Equipe com certificação DETRAN e treinamento anual de atualização." },
    ],
    faqs: [
      { q: "Qual a idade mínima para tirar habilitação?", a: "18 anos para todas as categorias. Para categoria A (moto) com restrição de cilindrada, pode ser antes." },
      { q: "Quantas aulas práticas são necessárias?", a: "Mínimo de 20 aulas práticas exigidas pelo DETRAN. Alunos com mais dificuldade fazem aulas extras." },
      { q: "Em quanto tempo consigo a habilitação?", a: "Em média 3 a 5 meses, dependendo da disponibilidade de horários e desempenho nas aulas." },
      { q: "E se eu reprovar na prova?", a: "Apoiamos com revisão de conteúdo e a segunda tentativa é sem custo adicional para os pontos teóricos." },
      { q: "Posso começar as aulas práticas antes da teórica?", a: "Não, é exigência do DETRAN: primeiro a teórica, depois a prática." },
      { q: "Vocês fazem o psicotécnico?", a: "Sim! Temos psicólogo credenciado pelo DETRAN na própria unidade." },
    ],
    testimonials: [
      { initials: "LV", name: "Lucas Vieira", text: "Passei de primeira na prova. Instrutores super pacientes e as aulas são muito bem explicadas. Recomendo muito!" },
      { initials: "JM", name: "Juliana Martins", text: "Tinha muito medo de dirigir e depois das aulas me sinto super segura. Pessoal incrível e muito atencioso." },
      { initials: "RF", name: "Rafael Fonseca", text: "Fiz reciclagem e foi bem mais dinâmico do que esperava. Aprendi coisas novas mesmo depois de 10 anos dirigindo." },
    ],
    heroTitle: (_e, _n, cidade) => `Autoescola em ${cidade} — Habilitação Rápida com Alta Aprovação`,
    heroSub: "Aulas teóricas e práticas com instrutores certificados e horários que cabem na sua rotina.",
    ctaUrgency: "Comece hoje! Vagas abertas para o próximo turno. Garanta a sua no WhatsApp.",
    footerHours: "Seg–Sex: 7h às 19h | Sáb: 7h às 13h",
  },

  manicure: {
    primary: "#ec4899", primaryDark: "#db2777",
    bg: "#0f0209", card: "#1e0515",
    services: [
      { icon: "💅", name: "Manicure Completa", desc: "Cutículas, lixamento, esmaltação impecável com acabamento profissional." },
      { icon: "🦶", name: "Pedicure Completa", desc: "Hidratação, esfoliação e esmaltação que seus pés merecem." },
      { icon: "💎", name: "Gel UV", desc: "Esmaltação em gel com durabilidade de até 4 semanas sem lascar." },
      { icon: "🔮", name: "Unhas em Acrílico", desc: "Alongamento e modelagem para unhas fortes, elegantes e duradouras." },
      { icon: "🌸", name: "Nail Art", desc: "Designs exclusivos, degradê, estampas e glitter para cada ocasião." },
      { icon: "🌿", name: "Banho de Parafina", desc: "Hidratação profunda para mãos e pés com parafina terapêutica." },
    ],
    differentials: [
      { icon: "🧼", title: "Esterilização Total", desc: "Materiais autoclavados e descartáveis para sua total segurança e saúde." },
      { icon: "🎨", title: "Nail Art Exclusiva", desc: "Designs únicos criados especialmente para você, sempre na tendência." },
      { icon: "⏰", title: "Horário Estendido", desc: "Atendimento de manhã a noite, inclusive finais de semana." },
    ],
    faqs: [
      { q: "Quanto tempo dura o gel?", a: "Em média 3 a 4 semanas sem lascar, com cuidados básicos como hidratação diária." },
      { q: "A acetona enfraquece as unhas?", a: "Quando usada com técnica correta e hidratação pós-remoção, não danifica. Fazemos de forma segura." },
      { q: "Posso fazer gel em unhas curtas?", a: "Sim! Gel pode fortalecer e deixar até unhas curtas com aparência linda." },
      { q: "O acrílico danifica a unha natural?", a: "Com aplicação e remoção corretas, não. Usamos técnicas que preservam a lamina ungueal." },
      { q: "Como marco meu horário?", a: "Pelo WhatsApp! Temos agenda online e confirmamos na hora." },
      { q: "Fazem domicílio?", a: "Para grupos acima de 4 pessoas realizamos atendimento a domicílio. Consulte disponibilidade." },
    ],
    testimonials: [
      { initials: "BF", name: "Beatriz Freitas", text: "Minhas unhas nunca ficaram tão bonitas! O gel dura semanas e a nail art é simplesmente incrível." },
      { initials: "TC", name: "Tânia Cardoso", text: "Fui pela primeira vez e já saí marcando o próximo. Atendimento carinhoso e resultado perfeito!" },
      { initials: "KO", name: "Karla Oliveira", text: "Finalmente encontrei um lugar que esteriliza tudo de verdade. Segurança e beleza juntas!" },
    ],
    heroTitle: (_e, _n, cidade) => `Nail Designer em ${cidade} — Unhas Perfeitas Todo Dia`,
    heroSub: "Manicure, pedicure, gel e nail art com técnicas avançadas e total segurança sanitária.",
    ctaUrgency: "Agenda com vagas limitadas — garanta já o seu horário no WhatsApp!",
    footerHours: "Seg–Sex: 9h às 20h | Sáb: 8h às 18h",
  },

  spa: {
    primary: "#8b5cf6", primaryDark: "#7c3aed",
    bg: "#060312", card: "#0d071f",
    services: [
      { icon: "💆", name: "Massagem Relaxante", desc: "Técnica sueca com óleos essenciais para eliminar tensão e estresse." },
      { icon: "🎯", name: "Massagem Terapêutica", desc: "Alívio de dores musculares, postura e tensões crônicas com técnica específica." },
      { icon: "💧", name: "Drenagem Linfática", desc: "Redução de inchaço, celulite e melhora da circulação com movimentos precisos." },
      { icon: "🌿", name: "Aromaterapia", desc: "Óleos essenciais terapêuticos para equilíbrio corpo-mente profundo." },
      { icon: "🔥", name: "Pedras Quentes", desc: "Basalto vulcânico para relaxamento muscular profundo e bem-estar total." },
      { icon: "🌊", name: "Day Spa Completo", desc: "Pacote exclusivo com banho, esfoliação, massagem e ritual de hidratação." },
    ],
    differentials: [
      { icon: "🕯️", title: "Ambiente Zen", desc: "Espaço projetado para total desconexão: aromaterapia, música e iluminação especial." },
      { icon: "🌺", title: "Profissionais Certificados", desc: "Terapeutas com certificação e formação em técnicas nacionais e internacionais." },
      { icon: "🧴", title: "Produtos Naturais", desc: "Óleos e cremes veganos, sem parabenos e sem fragrância artificial." },
    ],
    faqs: [
      { q: "Posso fazer massagem se tiver pressão alta?", a: "Alguns tipos sim, outros não. Fazemos uma anamnese antes para indicar a técnica ideal e segura." },
      { q: "Com que frequência devo fazer massagem?", a: "Para manutenção e bem-estar, quinzenal. Para fins terapêuticos, pode ser semanal conforme indicação." },
      { q: "Preciso de roupa especial?", a: "Não! Fornecemos toalhas e roupão. Você fica à vontade na sua zona de conforto." },
      { q: "O que é o Day Spa?", a: "Pacote de 3 a 5 horas com sequência de tratamentos: banho, esfoliação, massagem e ritual final." },
      { q: "Posso presentear alguém com um voucher?", a: "Sim! Temos gift cards em diferentes valores. Ótima ideia de presente especial." },
      { q: "Vocês atendem casais?", a: "Sim! Temos sala de casal com massagem simultânea. Muito procurado para datas especiais." },
    ],
    testimonials: [
      { initials: "PL", name: "Patrícia Lemos", text: "Entrei estressada e saí completamente renovada. A massagem com pedras quentes foi transformadora. Vou todo mês!" },
      { initials: "AV", name: "Alexandre Vieira", text: "Day Spa de aniversário para minha esposa foi o melhor presente. Ela não parou de falar em como foi incrível." },
      { initials: "MC", name: "Marcia Cunha", text: "Drenagem linfática fez diferença enorme no meu inchaço. Profissional muito competente e ambiente perfeito." },
    ],
    heroTitle: (_e, _n, cidade) => `Spa & Massagem em ${cidade} — Seu Momento de Total Bem-Estar`,
    heroSub: "Massagens terapêuticas, drenagem linfática e rituais de relaxamento em ambiente exclusivo.",
    ctaUrgency: "Agende agora sua sessão e chegue mais perto do equilíbrio que você merece!",
    footerHours: "Seg–Sáb: 9h às 21h | Dom: 10h às 18h",
  },

  moveis: {
    primary: "#d97706", primaryDark: "#b45309",
    bg: "#0a0700", card: "#150f00",
    services: [
      { icon: "🍳", name: "Cozinha Planejada", desc: "Projeto sob medida com aproveitamento total do espaço e acabamento premium." },
      { icon: "🛏️", name: "Dormitório Completo", desc: "Guarda-roupas, camas box e nichos personalizados para cada ambiente." },
      { icon: "🛋️", name: "Sala de Estar & TV", desc: "Painéis de TV, estantes e racks que transformam sua sala." },
      { icon: "💻", name: "Home Office", desc: "Escritório funcional e bonito para trabalhar em casa com produtividade." },
      { icon: "🚿", name: "Banheiro & Lavabo", desc: "Armários de banheiro e espelheiras que otimizam cada centímetro." },
      { icon: "🏢", name: "Corporativo", desc: "Móveis planejados para escritórios, clínicas e estabelecimentos comerciais." },
    ],
    differentials: [
      { icon: "📐", title: "Projeto 3D Gratuito", desc: "Visualize seu ambiente antes de produzir com renderização em 3D sem custo." },
      { icon: "🔧", title: "Instalação Inclusa", desc: "Nossa equipe instala tudo com perfeição. Você não precisa contratar ninguém." },
      { icon: "🪵", title: "Materiais Certificados", desc: "MDF e MDP com certificação ABNT, resistentes e seguros para toda a família." },
    ],
    faqs: [
      { q: "Como funciona o projeto?", a: "Fazemos uma visita gratuita, medimos o ambiente e entregamos o projeto 3D em até 5 dias." },
      { q: "Quanto tempo leva para produzir?", a: "Em média 25 a 40 dias após a aprovação do projeto e pagamento do sinal." },
      { q: "Posso escolher as cores e materiais?", a: "Sim! Temos mais de 300 opções de acabamento para personalizar cada detalhe." },
      { q: "A instalação está incluída?", a: "Sim! Instalamos tudo com equipe própria. Não tem custo adicional." },
      { q: "Qual a garantia dos móveis?", a: "5 anos de garantia total em ferragens e estrutura, além de suporte pós-venda." },
      { q: "Atendem apartamentos pequenos?", a: "Especialmente! Móveis planejados são a melhor solução para otimizar espaços pequenos." },
    ],
    testimonials: [
      { initials: "HN", name: "Helena Nunes", text: "Minha cozinha ficou irreconhecível! O projeto 3D foi fundamental para visualizar antes. Resultado além da expectativa." },
      { initials: "DL", name: "Daniel Lima", text: "Home office impecável. Aproveitaram um espaço que eu nem imaginava que cabia tanta coisa. Profissionais excelentes!" },
      { initials: "AR", name: "Amanda Rocha", text: "Apartamento de 55m² virou referência de organização e estilo. Cada centímetro aproveitado com elegância." },
    ],
    heroTitle: (_e, _n, cidade) => `Móveis Planejados em ${cidade} — Seu Espaço Transformado`,
    heroSub: "Projeto gratuito em 3D, produção sob medida e instalação inclusa. Transforme cada ambiente da sua casa.",
    ctaUrgency: "Agende sua visita técnica gratuita agora e receba o projeto 3D do seu ambiente!",
    footerHours: "Seg–Sex: 8h às 18h | Sáb: 8h às 13h",
  },

  clinicamedica: {
    primary: "#06b6d4", primaryDark: "#0891b2",
    bg: "#020d10", card: "#051a1f",
    services: [
      { icon: "🩺", name: "Clínica Geral", desc: "Atendimento médico completo para diagnóstico, prevenção e tratamento." },
      { icon: "❤️", name: "Cardiologia", desc: "ECG, ecocardiograma e acompanhamento para a saúde do seu coração." },
      { icon: "🌿", name: "Dermatologia", desc: "Tratamento de pele, mapeamento de pintas e dermatoscopia digital." },
      { icon: "🔬", name: "Exames Laboratoriais", desc: "Coleta de sangue e resultados rápidos com laudo médico." },
      { icon: "🏃", name: "Medicina Esportiva", desc: "Atestados, avaliações e acompanhamento para atletas e praticantes." },
      { icon: "📋", name: "Check-up Completo", desc: "Pacote preventivo com exames, consultas e relatório de saúde geral." },
    ],
    differentials: [
      { icon: "⏱️", title: "Sem Fila de Espera", desc: "Consultas com hora marcada para você não perder tempo na sala de espera." },
      { icon: "📱", title: "Prontuário Digital", desc: "Histórico médico online e resultados de exames acessíveis pelo celular." },
      { icon: "🩻", title: "Equipamentos Modernos", desc: "Tecnologia de diagnóstico de última geração para maior precisão." },
    ],
    faqs: [
      { q: "Vocês aceitam plano de saúde?", a: "Sim! Trabalhamos com os principais convênios. Consulte a lista completa no WhatsApp." },
      { q: "Como marcar consulta?", a: "Pelo WhatsApp, telefone ou pelo nosso sistema online. Confirmamos em menos de 2h." },
      { q: "Fazem consultas de urgência?", a: "Sim! Reservamos vagas diárias para urgências. Ligue e informe a situação." },
      { q: "Os resultados de exame ficam disponíveis online?", a: "Sim! No mesmo dia ou em até 24h, acessíveis pelo portal do paciente." },
      { q: "Têm pediatra?", a: "Sim! Atendemos todas as faixas etárias. Consulte as especialidades disponíveis." },
      { q: "É necessário encaminhamento para especialistas?", a: "Não para consulta inicial. Após avaliação, indicamos o especialista mais adequado." },
    ],
    testimonials: [
      { initials: "SM", name: "Sônia Menezes", text: "Nunca fui tão bem atendida em uma clínica. Médico atencioso, sem pressa, explicou tudo claramente." },
      { initials: "WP", name: "Waldir Pereira", text: "Fiz o check-up completo e me trouxe muita tranquilidade. Processo muito bem organizado e rápido." },
      { initials: "NF", name: "Natasha Ferreira", text: "O prontuário digital é incrível. Acesso todo meu histórico pelo celular a qualquer hora." },
    ],
    heroTitle: (_e, _n, cidade) => `Clínica Médica em ${cidade} — Saúde com Qualidade e Agilidade`,
    heroSub: "Consultas médicas, exames laboratoriais e especialidades com agendamento fácil e sem fila.",
    ctaUrgency: "Agende sua consulta agora — vagas limitadas por dia para garantir atendimento de qualidade!",
    footerHours: "Seg–Sex: 7h às 20h | Sáb: 8h às 14h",
  },

  marketing: {
    primary: "#7c3aed", primaryDark: "#5b21b6",
    bg: "#05030f", card: "#0d081f",
    services: [
      { icon: "📱", name: "Gestão de Redes Sociais", desc: "Conteúdo estratégico para Instagram, TikTok, LinkedIn e Facebook." },
      { icon: "🎯", name: "Tráfego Pago", desc: "Campanhas no Meta Ads e Google Ads com foco em ROI e leads qualificados." },
      { icon: "🔍", name: "SEO", desc: "Posicionamento orgânico no Google para você aparecer quando o cliente procura." },
      { icon: "💻", name: "Criação de Sites", desc: "Sites profissionais, rápidos e otimizados para converter visitantes em clientes." },
      { icon: "📧", name: "Email Marketing", desc: "Automações e newsletters para nutrir leads e fidelizar clientes." },
      { icon: "📊", name: "Consultoria de Marketing", desc: "Diagnóstico completo e estratégia personalizada para crescer de forma previsível." },
    ],
    differentials: [
      { icon: "📈", title: "Foco em Resultado", desc: "Toda ação é rastreada e otimizada com dados reais. Sem achismo, só resultado." },
      { icon: "🔁", title: "Relatórios Semanais", desc: "Transparência total: você recebe relatório semanal de tudo que foi feito." },
      { icon: "🧠", title: "Estratégia Personalizada", desc: "Nenhum copy-paste de concorrente. Sua estratégia é criada 100% para o seu negócio." },
    ],
    faqs: [
      { q: "Em quanto tempo vejo resultados?", a: "Tráfego pago: 15–30 dias. SEO e conteúdo orgânico: 3–6 meses para resultados consistentes." },
      { q: "Quanto custa investir em tráfego pago?", a: "Recomendamos mínimo R$1.500/mês em verba + gestão. Fazemos simulação de resultado antes." },
      { q: "Vocês criam o conteúdo ou apenas gerenciam?", a: "Criamos tudo: textos, artes, reels e stories. Você só aprova." },
      { q: "Posso cancelar quando quiser?", a: "Nossos contratos são mensais com aviso de 30 dias. Sem multa e sem burocracia." },
      { q: "Trabalham com qual segmento?", a: "Atendemos PMEs de todos os segmentos com estratégias específicas para cada nicho." },
      { q: "Como acompanho os resultados?", a: "Dashboard de métricas em tempo real + relatório semanal detalhado por WhatsApp." },
    ],
    testimonials: [
      { initials: "HS", name: "Hugo Silveira", text: "Triplicamos os leads em 60 dias com a gestão de tráfego. ROI acima de 8x nos primeiros 3 meses!" },
      { initials: "CF", name: "Cristiane Faria", text: "O Instagram cresceu 3x e virou meu principal canal de vendas. Conteúdo de alto nível e estratégia certeira." },
      { initials: "TO", name: "Thales Oliveira", text: "SEO entregou resultados que eu não achava possível. Hoje apareço na 1ª página para as minhas 10 palavras-chave." },
    ],
    heroTitle: (_e, _n, cidade) => `Agência de Marketing Digital em ${cidade} — Resultados Reais`,
    heroSub: "Tráfego pago, redes sociais, SEO e sites para negócios que querem crescer de forma previsível.",
    ctaUrgency: "Agende uma consultoria gratuita e veja como podemos aumentar suas vendas ainda este mês!",
    footerHours: "Seg–Sex: 9h às 18h",
  },

  coach: {
    primary: "#eab308", primaryDark: "#ca8a04",
    bg: "#090700", card: "#140f00",
    services: [
      { icon: "🎯", name: "Coaching de Carreira", desc: "Clareza profissional, transição de carreira e posicionamento de mercado." },
      { icon: "💼", name: "Mentoria Empresarial", desc: "Estratégia, gestão de equipe e escalonamento para donos de negócio." },
      { icon: "🌱", name: "Coaching de Vida", desc: "Objetivos pessoais, equilíbrio e construção do estilo de vida dos seus sonhos." },
      { icon: "🧘", name: "Coaching de Saúde", desc: "Hábitos, rotinas e mindset para transformação física e mental duradoura." },
      { icon: "🎓", name: "Workshops e Palestras", desc: "Conteúdo de alto impacto para times e eventos corporativos." },
      { icon: "🔥", name: "Imersão Intensiva", desc: "Programa acelerado de 1 ou 2 dias para transformação profunda e rápida." },
    ],
    differentials: [
      { icon: "🏅", title: "Metodologia Comprovada", desc: "Abordagem baseada em ICF, PNL e neurociência com resultados documentados." },
      { icon: "📞", title: "Suporte Entre Sessões", desc: "Acesso via WhatsApp entre sessões para manter o momentum da transformação." },
      { icon: "📊", title: "Metas e Métricas", desc: "Cada objetivo é transformado em metas mensuráveis. Você vê o progresso acontecer." },
    ],
    faqs: [
      { q: "Qual a diferença entre coaching e psicologia?", a: "Coaching foca no presente e no futuro para atingir objetivos. Psicologia trata questões emocionais e do passado." },
      { q: "Quantas sessões são necessárias?", a: "Programas de 3 a 6 meses têm os melhores resultados. Mas há sessões avulsas para objetivos específicos." },
      { q: "As sessões são presenciais ou online?", a: "Online via Zoom ou presencial no consultório, conforme sua preferência." },
      { q: "Você é certificado?", a: "Sim, com certificação internacional ICF e formação em PNL e Neurociência Aplicada." },
      { q: "Em quanto tempo vejo resultados?", a: "Mudanças de comportamento e clareza já nas primeiras sessões. Resultados concretos em 60 a 90 dias." },
      { q: "Como é a primeira sessão?", a: "É uma sessão de diagnóstico gratuita para entender seus objetivos e verificar o alinhamento." },
    ],
    testimonials: [
      { initials: "FA", name: "Fabiana Alves", text: "Em 4 meses dobrei meu faturamento e recuperei equilíbrio na vida pessoal. Não imaginava que era possível tão rápido!" },
      { initials: "LB", name: "Lucas Barros", text: "A clareza que ganhei sobre minha carreira mudou tudo. Pedi aumento, fui promovido em 2 meses. Inacreditável!" },
      { initials: "RN", name: "Renata Neves", text: "Passei por burnout e o coaching me devolveu o prazer de trabalhar. Transformação real e duradoura." },
    ],
    heroTitle: (_e, _n, cidade) => `Coach & Mentoria em ${cidade} — Transforme Sua Vida e Carreira`,
    heroSub: "Coaching de carreira, life coaching e mentoria empresarial com metodologia comprovada e resultados reais.",
    ctaUrgency: "Agende sua sessão de diagnóstico gratuita — vagas limitadas por mês!",
    footerHours: "Seg–Sex: 8h às 20h | Sáb: 9h às 15h",
  },

  buffet: {
    primary: "#f59e0b", primaryDark: "#d97706",
    bg: "#0d0800", card: "#1a1200",
    services: [
      { icon: "💍", name: "Casamentos", desc: "Recepções inesquecíveis com decoração exclusiva, buffet e coordenação completa." },
      { icon: "🎓", name: "Formaturas", desc: "Jantar de gala e festa de formatura que honram essa conquista especial." },
      { icon: "🎉", name: "Festas Corporativas", desc: "Confraternizações, lançamentos e eventos de empresa com alto padrão." },
      { icon: "🎈", name: "Festas Infantis", desc: "Decoração temática, buffet de salgados e diversão para os pequenos." },
      { icon: "☕", name: "Coffee Break", desc: "Para treinamentos, workshops e reuniões com montagem e retirada inclusos." },
      { icon: "🥂", name: "Chá de Bebê & Bodas", desc: "Eventos íntimos e elegantes para celebrar os momentos mais especiais." },
    ],
    differentials: [
      { icon: "🍽️", title: "Gastronomia Premiada", desc: "Chef experiente com cardápio autoral e degustação antes do evento." },
      { icon: "🎨", title: "Decoração Própria", desc: "Equipe de decoração interna para eventos únicos e temáticos com sua identidade." },
      { icon: "📋", title: "Coordenação Completa", desc: "Cuidamos de cada detalhe para você aproveitar cada minuto da celebração." },
    ],
    faqs: [
      { q: "Com quanto tempo de antecedência devo contratar?", a: "Casamentos recomendamos 6–12 meses. Eventos corporativos e festas, 30–60 dias." },
      { q: "Posso fazer degustação antes de fechar?", a: "Sim! Oferecemos degustação do cardápio selecionado antes da assinatura do contrato." },
      { q: "Quantas pessoas vocês atendem?", a: "De 20 a 500 convidados dependendo do tipo de evento e espaço." },
      { q: "A decoração está inclusa?", a: "Temos pacotes com e sem decoração. Informamos todos os detalhes no orçamento." },
      { q: "Vocês fazem o serviço no meu próprio espaço?", a: "Sim! Trabalhamos em qualquer espaço. Também temos parceiros de salão." },
      { q: "Como funciona o pagamento?", a: "Sinal na assinatura do contrato, parcelas ao longo do período e quitação 7 dias antes." },
    ],
    testimonials: [
      { initials: "GF", name: "Gabriele Fonseca", text: "Meu casamento foi impecável do início ao fim. Cada detalhe que pedi foi executado com perfeição. Noite dos sonhos!" },
      { initials: "RP", name: "Ricardo Pimentel", text: "Confraternização de empresa com 200 pessoas e zero problema. Elogios de todos os convidados." },
      { initials: "MS", name: "Mariana Siqueira", text: "A degustação me conquistou. Na festa, o cardápio ficou ainda melhor. Chef excepcional!" },
    ],
    heroTitle: (_e, _n, cidade) => `Buffet & Eventos em ${cidade} — Sua Celebração Inesquecível`,
    heroSub: "Casamentos, festas corporativas e eventos especiais com gastronomia premiada e coordenação completa.",
    ctaUrgency: "Solicite seu orçamento agora e garanta a data do seu evento antes que esgote!",
    footerHours: "Seg–Sex: 9h às 18h | Sáb: 10h às 16h",
  },

  eletricista: {
    primary: "#eab308", primaryDark: "#ca8a04",
    bg: "#080800", card: "#141400",
    services: [
      { icon: "⚡", name: "Instalação Elétrica", desc: "Instalações novas e reformas com projeto, execução e ART do engenheiro." },
      { icon: "🔌", name: "Quadro de Distribuição", desc: "Dimensionamento, substituição e ampliação de quadros com disjuntores." },
      { icon: "⛈️", name: "SPDA / Para-raios", desc: "Sistema de proteção contra descargas atmosféricas com laudo técnico." },
      { icon: "🏠", name: "Automação Residencial", desc: "Interruptores inteligentes, dimmers e controle por celular." },
      { icon: "❄️", name: "Ar Condicionado", desc: "Instalação, manutenção e limpeza de split, cassete e central." },
      { icon: "📄", name: "Laudo Elétrico", desc: "Inspeção e laudo técnico obrigatório para imóveis com ART registrada." },
    ],
    differentials: [
      { icon: "📋", title: "ART Garantida", desc: "Toda instalação com Anotação de Responsabilidade Técnica de engenheiro." },
      { icon: "🔒", title: "Segurança em 1º Lugar", desc: "Seguimos rigorosamente as normas ABNT NBR 5410 em cada serviço." },
      { icon: "⏱️", title: "Atendimento Urgente", desc: "Para emergências elétricas, respondemos em até 2 horas." },
    ],
    faqs: [
      { q: "Precisam de ART para instalações residenciais?", a: "Para obras acima de determinado porte, a ART é obrigatória e garante segurança e cobertura do seguro." },
      { q: "O que é SPDA?", a: "Sistema de Proteção contra Descargas Atmosféricas (para-raios) — obrigatório em edifícios acima de 5 pavimentos." },
      { q: "Quanto tempo leva uma instalação nova?", a: "Depende do porte. Uma residência de 100m² leva em média 5 a 10 dias úteis." },
      { q: "Atendem emergências?", a: "Sim! Para curtos-circuitos e choque elétrico, temos atendimento de urgência em até 2 horas." },
      { q: "Fazem manutenção preventiva?", a: "Sim! Recomendamos revisão elétrica anual para prevenir incêndios e falhas." },
      { q: "Trabalham com condomínios e empresas?", a: "Sim, atendemos residências, condomínios, empresas e indústrias." },
    ],
    testimonials: [
      { initials: "JA", name: "José Almeida", text: "Reforma elétrica completa do meu comércio. Tudo com ART e dentro do prazo. Profissionalismo exemplar!" },
      { initials: "VR", name: "Vera Rocha", text: "Instalaram automação na minha casa e ficou simplesmente incrível. Controlo tudo pelo celular agora!" },
      { initials: "CN", name: "Carlos Nascimento", text: "Emergência de curto-circuito às 22h e eles vieram em 1h20. Resolveram tudo e ficamos seguros." },
    ],
    heroTitle: (_e, _n, cidade) => `Eletricista em ${cidade} — Instalações Seguras com ART`,
    heroSub: "Instalações elétricas, automação residencial, ar condicionado e laudos técnicos com total segurança.",
    ctaUrgency: "Solicite seu orçamento gratuito agora. Atendimento de urgência disponível 24h!",
    footerHours: "Seg–Sex: 7h às 18h | Sáb: 7h às 13h | Urgências: 24h",
  },
};

function matchNicho(nicho: string): NichoConfig {
  const lower = nicho.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Energia Solar — must come before generic "energia" checks
  if (lower.includes("solar") || lower.includes("energia solar") || lower.includes("painel") || lower.includes("fotovoltaic")) return NICHO_MAP.energiasolar!;
  // Pet Shop (before veterinário to give it priority)
  if (lower.includes("pet shop") || lower.includes("petshop")) return NICHO_MAP.petshop!;
  // Veterinário
  if (lower.includes("veterinar") || lower.includes("clinica vet") || lower.includes("med vet")) return NICHO_MAP.veterinario!;
  // Barbearia
  if (lower.includes("barbearia") || lower.includes("barber")) return NICHO_MAP.barbearia!;
  // Salão / Beleza
  if (lower.includes("salao") || lower.includes("salon") || lower.includes("cabelereiro") || lower.includes("cabelereira")) return NICHO_MAP.salao!;
  // Dentista / Odontologia
  if (lower.includes("dent") || lower.includes("odonto")) return NICHO_MAP.dentista!;
  // Psicólogo / Terapeuta
  if (lower.includes("psicolog") || lower.includes("terapeu") || lower.includes("psicanali")) return NICHO_MAP.psicologo!;
  // Nutricionista
  if (lower.includes("nutri")) return NICHO_MAP.nutricionista!;
  // Academia / Fitness
  if (lower.includes("academia") || lower.includes("gym") || lower.includes("fitness") || lower.includes("crossfit")) return NICHO_MAP.academia!;
  // Personal Trainer — before academia
  if (lower.includes("personal") || lower.includes("treinador")) return NICHO_MAP.personal!;
  // Advogado / Jurídico
  if (lower.includes("advogado") || lower.includes("advocacia") || lower.includes("juridic") || lower.includes("direito")) return NICHO_MAP.advogado!;
  // Imobiliária / Corretor
  if (lower.includes("imobiliaria") || lower.includes("imovel") || lower.includes("corretor") || lower.includes("corretora de imoveis")) return NICHO_MAP.imobiliaria!;
  // Contabilidade / Contador
  if (lower.includes("contabil") || lower.includes("contador") || lower.includes("contadora") || lower.includes("escritorio contabil") || lower.includes("bpo")) return NICHO_MAP.contabilidade!;
  // Marketing Digital / Agência
  if (lower.includes("marketing") || lower.includes("agencia") || lower.includes("trafego pago") || lower.includes("social media")) return NICHO_MAP.marketing!;
  // Coach / Mentoria
  if (lower.includes("coach") || lower.includes("mentori") || lower.includes("mentor")) return NICHO_MAP.coach!;
  // Buffet / Eventos
  if (lower.includes("buffet") || lower.includes("salao de festas") || lower.includes("espaco de eventos") || lower.includes("espaco para festas")) return NICHO_MAP.buffet!;
  // Hamburgueria / Fast food
  if (lower.includes("hamburguer") || lower.includes("burger") || lower.includes("hamburgueria") || lower.includes("smash")) return NICHO_MAP.hamburgueria!;
  // Restaurante / Gastronomia (after hamburgueria)
  if (lower.includes("restaurante") || lower.includes("lanchonete") || lower.includes("comida") || lower.includes("gastrono") || lower.includes("pizzaria") || lower.includes("churrascaria")) return NICHO_MAP.restaurante!;
  // Padaria / Confeitaria
  if (lower.includes("padaria") || lower.includes("confeitaria") || lower.includes("doceria") || lower.includes("pastelaria") || lower.includes("bakery")) return NICHO_MAP.padaria!;
  // Fotógrafo / Fotografia
  if (lower.includes("foto") || lower.includes("fotograf")) return NICHO_MAP.fotografia!;
  // Lava Jato / Higienização
  if (lower.includes("lava jato") || lower.includes("lavajato") || lower.includes("lavagem de carro") || lower.includes("higienizacao veicular") || lower.includes("estetica automotiva")) return NICHO_MAP.lavajato!;
  // Oficina Mecânica
  if (lower.includes("oficina") || lower.includes("mecanica") || lower.includes("mecanico") || lower.includes("automovel") || lower.includes("funilaria")) return NICHO_MAP.oficina!;
  // Autoescola / CFC
  if (lower.includes("autoescola") || lower.includes("cfc") || lower.includes("centro de formacao") || lower.includes("habilitacao")) return NICHO_MAP.autoescola!;
  // Manicure / Nail Designer
  if (lower.includes("manicure") || lower.includes("nail") || lower.includes("pedicure") || lower.includes("unhas")) return NICHO_MAP.manicure!;
  // Spa / Massagem
  if (lower.includes("spa") || lower.includes("massagem") || lower.includes("massoterapia") || lower.includes("aromaterapia") || lower.includes("drenagem linfatica")) return NICHO_MAP.spa!;
  // Móveis Planejados / Marcenaria
  if (lower.includes("moveis") || lower.includes("marcenaria") || lower.includes("marceneiro") || lower.includes("armario")) return NICHO_MAP.moveis!;
  // Eletricista / Instalações Elétricas
  if (lower.includes("eletric") || lower.includes("instalacao eletrica") || lower.includes("ar condicionado") || lower.includes("para-raios") || lower.includes("spda")) return NICHO_MAP.eletricista!;
  // Arquiteto / Designer de Interiores
  if (lower.includes("arquite") || lower.includes("design de interior") || lower.includes("decoracao") || lower.includes("interiores")) return NICHO_MAP.arquiteto!;
  // Escola / Cursos
  if (lower.includes("escola") || lower.includes("idioma") || lower.includes("ingles") || lower.includes("curso") || lower.includes("natacao") || lower.includes("musica") || lower.includes("danca")) return NICHO_MAP.escola!;
  // Cerimonialista / Eventos
  if (lower.includes("cerimonia") || lower.includes("cerimonialista") || lower.includes("casamento") || lower.includes("wedding") || lower.includes("debutante")) return NICHO_MAP.cerimonialista!;
  // Fisioterapia
  if (lower.includes("fisio")) return NICHO_MAP.fisioterapia!;
  // Estética / Clínica Estética
  if (lower.includes("estetic") || lower.includes("clinica est") || lower.includes("estetica")) return NICHO_MAP.estetica!;
  // Clínica Médica / Médico (broad medical check last)
  if (lower.includes("medic") || lower.includes("clinica") || lower.includes("saude") || lower.includes("cardiolog") || lower.includes("dermato") || lower.includes("ginecolog")) return NICHO_MAP.clinicamedica!;

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
