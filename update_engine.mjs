import fs from 'fs';

const path = 'artifacts/api-server/src/lib/contai-engine.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace specific missing info lines
content = content.replace(/return "Foi gasto com o quê\?";/, 'return { reply: "Foi gasto com o quê?", isMissingInfo: true };');

content = content.replace(/return parsed\.intent === "registrar_gasto" \? "Qual foi o valor\?" : "Qual foi o valor da entrada\?";/, 'return { reply: parsed.intent === "registrar_gasto" ? "Qual foi o valor?" : "Qual foi o valor da entrada?", isMissingInfo: true };');

content = content.replace(/return "Me fala só mais uma coisa pra organizar certo: esse registro é da sua \\\*conta pessoal\\\* ou da \\\*conta da casa\\\*\?";/, 'return { reply: "Me fala só mais uma coisa pra organizar certo: esse registro é da sua *conta pessoal* ou da *conta da casa*?", isMissingInfo: true };');

content = content.replace(/return "E qual foi a forma de pagamento\? \\(débito, crédito, pix, dinheiro ou boleto\\)";/, 'return { reply: "E qual foi a forma de pagamento? (débito, crédito, pix, dinheiro ou boleto)", isMissingInfo: true };');

// Replace standard successful returns
content = content.replace(/return baseMessage;/g, 'return { reply: baseMessage };');

content = content.replace(/return resolveBotTemplateMessage\([\s\S]*?\);/g, match => `return { reply: ${match.slice(7, -1)} };`);

content = content.replace(/return replyDate[\s\S]*?`\] Lembrete.*`;/g, match => `return { reply: ${match.slice(7, -1)} };`);

content = content.replace(/return formatResume\([\s\S]*?\);/g, match => `return { reply: ${match.slice(7, -1)} };`);

content = content.replace(/return await formatHistory\([\s\S]*?\);/g, match => `return { reply: ${match.slice(7, -1)} };`);

content = content.replace(/return formatCategories\([\s\S]*?\);/g, match => `return { reply: ${match.slice(7, -1)} };`);

content = content.replace(/return formatMetaProgression\([\s\S]*?\);/g, match => `return { reply: ${match.slice(7, -1)} };`);

// For "ajuda"
content = content.replace(/return systemSettings\.botHelpText \? resolveBotTemplateMessage\(systemSettings\.botHelpText, appBaseUrl\) : resolveBotTemplateMessage\(/g, "return { reply: systemSettings.botHelpText ? resolveBotTemplateMessage(systemSettings.botHelpText, appBaseUrl) : resolveBotTemplateMessage(");

content = content.replace(/botRole, appBaseUrl, "\n"\)\);/g, 'botRole, appBaseUrl, "\\n")) };');

// Finally, we replace the call sites: `let reply = await saveParsedAction(...)` to `let { reply, isMissingInfo } = await saveParsedAction(...)` 

fs.writeFileSync(path, content);
console.log('done modifying returns');
