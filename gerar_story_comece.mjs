import fs from 'fs';

// Vamos usar a base completamente limpa do Celular sem letras!
const imagePath = 'C:/Users/MaiconBatn/.gemini/antigravity/brain/fe6978d4-9080-4e29-8965-eb20abd4c016/contai_base_phone_1775150582216.png';

// Converte pra base64 pra não bugar no navegador
const base64Image = fs.readFileSync(imagePath, 'base64');
const imgSrc = `data:image/png;base64,${base64Image}`;

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Story Comece Aqui</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Inter:wght@400;500;700&display=swap');
    
    body {
      background-color: #020617;
      color: white;
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      display: flex;
      flex-wrap: wrap;
      gap: 40px;
      justify-content: center;
    }

    .story-container {
      width: 400px;
      height: 711px;
      position: relative;
      background-color: #050b12;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }

    /* Fundo limpo, escalado apenas para mostrar o aparelho na parte de baixo de forma elegante */
    .phone-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('${imgSrc}');
      background-size: 250%; /* Amplia severamente a imagem */
      background-position: 80% 50%; /* Arrasta o celular (que fica na direita) exato pro miolo central */
      background-repeat: no-repeat;
      z-index: 1;
    }

    /* Uma camada suave para a letra branca se destacar no topo */
    .overlay-top {
      position: absolute;
      top: 0; left: 0; right: 0; height: 50%;
      background: linear-gradient(180deg, rgba(2,6,23,0.95) 0%, transparent 100%);
      z-index: 2;
    }

    .mask-bottom {
      position: absolute;
      bottom: 0; left: 0; right: 0; height: 35%;
      background: linear-gradient(0deg, #050b12 80%, transparent 100%);
      z-index: 2;
    }

    .content {
      position: absolute;
      top: 15px;
      left: 10px;
      right: 10px;
      z-index: 10;
      text-align: center;
    }

    .title {
      font-family: 'Montserrat', sans-serif;
      font-size: 38px;
      font-weight: 900;
      line-height: 1.1;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      text-shadow: 0 4px 12px rgba(0,0,0,0.8);
      background: linear-gradient(to right, #ffffff, #a7f3d0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1px;
    }

    .subtitle {
      font-size: 17px;
      color: #e2e8f0;
      font-weight: 500;
      line-height: 1.5;
      padding: 0 10px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    }
    
    .cta-area {
      position: absolute;
      bottom: 50px;
      left: 0;
      right: 0;
      text-align: center;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .arrow-down {
      font-size: 24px;
      margin-bottom: 10px;
      color: #10b981;
      animation: bounce 2s infinite;
      text-shadow: 0 2px 5px rgba(0,0,0,0.5);
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }

    .btn-wpp {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 20px;
      padding: 16px 32px;
      border-radius: 40px;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      border: 2px solid rgba(255,255,255,0.2);
    }

    .btn-desc {
      margin-top: 15px;
      font-size: 13px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

  </style>
</head>
<body>
  <div class="story-container">
    <div class="phone-bg"></div>
    <div class="overlay-top"></div>
    <div class="mask-bottom"></div>
    
    <div class="content">
      <h1 class="title">Faça o Teste<br>Agora</h1>
      <p class="subtitle">Você no controle total do seu dinheiro, direto na sua palma da mão.</p>
    </div>

    <div class="cta-area">
      <div class="arrow-down">👇🏿👇🏽👇🏻</div>
      <div class="btn-wpp">💬 COMECE AQUI</div>
      <div class="btn-desc">Clique no link e fale com a IA</div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('story_comece.html', htmlContent);
console.log('Story gerado com absoluto sucesso.');
