import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log("Iniciando a câmera mágica do Puppeteer...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Alta resolução
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 3 });

  // 1. Snapshot do Story Segurança
  console.log("Batendo foto do Story de Segurança...");
  await page.goto(`file://${path.resolve(__dirname, 'docs/assets/marketing/story_seguranca.html')}`, { waitUntil: 'load' });
  const storySegurancaElement = await page.$('.story-container');
  if (storySegurancaElement) {
    await storySegurancaElement.screenshot({ path: 'docs/assets/marketing/STORY_Seguranca_Alta_Resolucao.png' });
  }

  // 2. Snapshot do Story Comece Aqui
  console.log("Batendo foto do Story Comece Aqui...");
  await page.goto(`file://${path.resolve(__dirname, 'docs/assets/marketing/story_comece.html')}`, { waitUntil: 'load' });
  const storyComeceElement = await page.$('.story-container');
  if (storyComeceElement) {
    await storyComeceElement.screenshot({ path: 'docs/assets/marketing/STORY_Comecar_Alta_Resolucao.png' });
  }

  // 3. Snapshot dos Posts Prontos
  console.log("Batendo foto do Carrossel de Posts...");
  await page.goto(`file://${path.resolve(__dirname, 'docs/assets/marketing/posts_prontos.html')}`, { waitUntil: 'load' });
  const posts = await page.$$('.post-container');
  for (let i = 0; i < posts.length; i++) {
    await posts[i].screenshot({ path: `docs/assets/marketing/POST_FEED_Carrossel_${i + 1}_Alta_Resolucao.png` });
  }

  await browser.close();
  console.log("📸 TUDO PRONTO! Imagens salvas como .png oficiais.");
})();
