# Prompt para o Gemini — completar Charada 2 (se faltar) e criar Charada 3 do jogo da forca

> Cole tudo o que está abaixo (a partir de "## PROMPT") em uma conversa com o Gemini. O bloco de dados no final é o banco completo e atual das 321 palavras, para ele usar como referência e não repetir nem se aproximar demais do estilo/piada já usada.

---

## PROMPT

Você vai escrever charadas em português (Brasil) para um jogo da forca educacional (site de aulas particulares, público adolescente/pré-vestibular). Cada palavra do banco já tem duas charadas ("charada" e "charada2"). Sua tarefa:

1. Para toda palavra que **não tiver** "charada2" preenchida (veja o campo `charada2_status` de cada item lá embaixo — vai vir marcado como `FALTANDO`), crie a Charada 2 que falta.
2. Para **todas as 321 palavras**, crie uma **Charada 3** nova (campo `charada3`).

### O que é a "charada" neste jogo
Não é uma definição de dicionário. É a palavra **falando na primeira pessoa**, de forma engraçada, irônica ou observacional, descrevendo algo verdadeiro sobre ela (um uso, uma sensação, um clichê, uma situação do dia a dia de estudante ou de qualquer pessoa) — SEM nunca dizer a própria palavra. Quem lê a charada deve conseguir adivinhar a palavra pensando "ah, isso é [palavra]!", mas a graça também tem que funcionar por si só, como uma piada curta.

### Estilo (baseado nas charadas já existentes do banco)
- Sempre em 1ª pessoa (a palavra "fala"): "Eu sou...", "Faço...", "Ninguém...", "Todo mundo me...", etc. Nem toda charada precisa começar com "Eu sou", mas o sujeito implícito é sempre a própria palavra.
- Tom: bem-humorado, um pouco sarcástico, com observação social/cotidiana (situação de sala de aula, família, redes sociais, boteco, trânsito, WhatsApp, faculdade, prova, etc.), não é humor infantil nem puramente técnico.
- Uma frase só (às vezes com vírgula/duas orações ligadas por "e", "mas", "e ainda assim"), sem parecer um textão.
- Pode citar detalhes técnicos reais da palavra (ex.: "regra de três", "organela", "crase"), mas sempre amarrados a uma piada ou situação absurda/cotidiana — nunca uma definição seca de livro didático.
- Evite repetir a mesma estrutura de frase de outra charada da mesma palavra (a Charada 2 e a Charada 3 têm que soar diferentes uma da outra, com ângulos diferentes sobre a mesma palavra) e evite repetir piadas/situações já usadas em OUTRAS palavras do banco (por exemplo, várias palavras já usam "prova", "trânsito", "grupo de família", "aeroporto" etc. — pode usar esses contextos de novo se for natural, mas a piada específica tem que ser nova, não um "quase clone" de outra charada existente).
- Não repita quase a mesma frase que já existe (nem para a mesma palavra, nem para palavras diferentes). Não vale só trocar uma ou duas palavras de uma charada já existente.
- Não pode citar a palavra-resposta (nem no singular, plural, ou variação óbvia) dentro da própria charada.
- Tamanho-alvo: entre 12 e 30 palavras por charada (mesma faixa das existentes).

### Exemplos reais do banco (para calibrar o tom — não repita nenhum destes, são só referência de estilo)
- artes → "Todo mundo me acha fácil até alguém pedir pra desenhar um cavalo de frente." / "Ninguém estuda pra mim achando que vai ser reprovado, e é exatamente aí que a nota vem baixa."
- física → "Explico por que seu celular, entre todas as posições possíveis, sempre escolhe cair com a tela pra baixo." / "Prevejo a trajetória de qualquer objeto no ar, menos a da sua paciência na aula de manhã cedo."
- matemática → "Toda vida adulta promete que você nunca mais vai precisar achar o valor de x, e a vida adulta mente descaradamente." / "Prometo que a vida real usa regra de três todo dia, e a vida real nunca comprova isso na sua frente."
- inglês → "Te deixo cantar um hit inteiro com pronúncia perfeita e travar solenemente na hora de pedir satisfação no aeroporto." / "Deixo você dublar filme inteiro sozinho no quarto e travar solene na hora de pedir o cardápio em outro país."

### Regras de saída (importante)
- Devolva **apenas um bloco de código JSON** (nada de texto antes ou depois), no seguinte formato: uma lista de objetos, um por palavra, exatamente na mesma ordem em que aparecem no banco de dados abaixo, contendo:
  - `"topico"`: copie exatamente como está no banco.
  - `"palavra"`: copie exatamente como está no banco.
  - `"charada2"`: se já existir no banco (status "OK"), repita exatamente igual, sem alterar; se estiver "FALTANDO", escreva a nova Charada 2.
  - `"charada3"`: sempre uma charada nova (para as 321 palavras).
- Não pule nenhuma palavra. Confira ao final que a lista tem exatamente 321 objetos.
- Não invente palavras novas, não mude a grafia da palavra, não mude o tópico.
- Antes de finalizar, revise você mesmo se alguma charada3 ficou parecida demais com a charada1, a charada2 da mesma palavra, ou com qualquer charada de outra palavra do banco, e reescreva se estiver parecida.

Abaixo está o banco completo (321 palavras) para você usar como referência de estilo e para saber, por palavra, se falta ou não a Charada 2.


### Banco de dados atual (referência completa)

```json
[
  {
    "topico": "Matérias escolares",
    "palavra": "artes",
    "charada": "Todo mundo me acha fácil até alguém pedir pra desenhar um cavalo de frente.",
    "charada2": "Ninguém estuda pra mim achando que vai ser reprovado, e é exatamente aí que a nota vem baixa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "biologia",
    "charada": "Todo mundo decorou o nome de uma organela só pra fazer meme, e ninguém mais lembra pra que ela serve.",
    "charada2": "Bagunço a mesa de exame de sangue e ainda assim explico por que seu pai é careca.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "espanhol",
    "charada": "Todo brasileiro acha que me fala fluentemente só de colocar um 'ito' no final das palavras.",
    "charada2": "Ensino que 'exquisito' não quer dizer esquisito, e ainda assim ninguém aprende essa numa vida inteira.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "filosofia",
    "charada": "Deixo um adolescente de 16 anos numa crise existencial só de perguntar 'o que é o ser'.",
    "charada2": "Faço um menino de 16 anos duvidar da própria existência, mas nunca duvidar do lanche da cantina.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "física",
    "charada": "Explico por que seu celular, entre todas as posições possíveis, sempre escolhe cair com a tela pra baixo.",
    "charada2": "Prevejo a trajetória de qualquer objeto no ar, menos a da sua paciência na aula de manhã cedo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "geografia",
    "charada": "Você sabe a capital de um país que nunca vai visitar, mas esquece onde estacionou o carro.",
    "charada2": "Sei quantos fusos horários separam você do primo que mora fora, mas não sei prever se vai chover amanhã.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "história",
    "charada": "Alguém decepcionado vive dizendo que eu me repito, mas ninguém repete a prova sobre mim se colar direito.",
    "charada2": "Ensino que tudo já aconteceu antes, inclusive você jurar que ia estudar 'com antecedência'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "inglês",
    "charada": "Te deixo cantar um hit inteiro com pronúncia perfeita e travar solenemente na hora de pedir satisfação no aeroporto.",
    "charada2": "Deixo você dublar filme inteiro sozinho no quarto e travar solene na hora de pedir o cardápio em outro país.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "literatura",
    "charada": "Fingir que te leu inteira antes da prova é praticamente uma segunda matéria à parte.",
    "charada2": "Transformo affair de personagem fictício em trauma real de leitor no capítulo 12.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "matemática",
    "charada": "Toda vida adulta promete que você nunca mais vai precisar achar o valor de x, e a vida adulta mente descaradamente.",
    "charada2": "Prometo que a vida real usa regra de três todo dia, e a vida real nunca comprova isso na sua frente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "português",
    "charada": "A única matéria em que 'mim fazer isso' está errado, mas sai natural na hora de falar.",
    "charada2": "Ensino a crase que ninguém usa, mas todo mundo finge saber quando cobra do colega.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "química",
    "charada": "Sou a razão do professor falar 'não façam isso em casa' logo depois de fazer bem na sua frente.",
    "charada2": "Explico reação que muda de cor, mas nunca explico por que o cheiro do laboratório gruda na roupa até de noite.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "redação",
    "charada": "Ninguém nunca viu um 1000 de verdade em mim, só ouviu falar, que nem disco voador.",
    "charada2": "Cobro conectivo variado, mas aceito 'além disso' repetido cinco vezes se a ideia for boa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matérias escolares",
    "palavra": "sociologia",
    "charada": "Te ensinei a dizer 'isso é uma construção social' pra ganhar qualquer discussão no almoço de domingo.",
    "charada2": "Ensino que toda mesa de bar vira debate de sociedade, principalmente quando ninguém te pediu opinião.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "altura",
    "charada": "A desculpa clássica de quem não alcança a prateleira de cima do mercado.",
    "charada2": "Apareço na ficha médica, mas na fila do brinquedo do parque sou eu quem decide se você entra ou não.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "ângulo",
    "charada": "Toda selfie busca o melhor de mim antes de postar.",
    "charada2": "Tenho graus que ninguém sente na pele, ao contrário dos graus do termômetro em fevereiro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "área",
    "charada": "O motivo de duas pessoas discutirem sobre quem tem o quintal maior.",
    "charada2": "Multiplico dois lados e ainda assim ninguém confia em mim pra saber se o sofá novo vai caber na sala.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "cálculo",
    "charada": "Ninguém nunca resolveu um de mim de cabeça sem fingir que já sabia a resposta.",
    "charada2": "Também sou o nome de uma pedra chata no rim, e nenhuma das duas versões de mim é bem-vinda.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "círculo",
    "charada": "Não tenho começo nem fim, e mesmo assim toda discussão de família parece terminar do mesmo jeito que eu.",
    "charada2": "Sou a forma que todo mundo desenha torta na lousa, mesmo usando o compasso.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "conta",
    "charada": "Sempre chega no fim do mês e nunca fecha do jeito que você espera.",
    "charada2": "Também sou aquele pedido que ninguém quer pegar primeiro no restaurante.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "distância",
    "charada": "Sempre parece menor no mapa do carro do que quando você está andando a pé.",
    "charada2": "Separo você do sofá até a geladeira, e mesmo assim pareço longa demais às 23h.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "divisão",
    "charada": "A pior parte de qualquer conta de restaurante em grupo.",
    "charada2": "Separo o time do recreio, e nunca sobra ninguém satisfeito com o resultado.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "dobro",
    "charada": "O que você promete estudar amanhã depois de não estudar nada hoje.",
    "charada2": "Peço mais uma hora de sono e você me dá o dobro do soneca.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "equação",
    "charada": "Tenho um lado igual ao outro, mas isso não impede ninguém de me errar feio na prova.",
    "charada2": "Tenho incógnita, mas quem realmente não sabe o que fazer é quem começa a resolver sem ler o enunciado inteiro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "escala",
    "charada": "Reduzo o mundo inteiro pra caber numa folha de papel, mas ninguém confia em mim pra montar móvel.",
    "charada2": "Também sou aquela que o músico sobe e desce, e ninguém acerta de primeira.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "estatística",
    "charada": "Prometo que a maioria concorda com você, mesmo quando ninguém perguntou a ninguém.",
    "charada2": "Digo que 1 em cada 2 pessoas não confia em mim, e a outra metade nem me leu direito.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "fração",
    "charada": "Prometo uma parte do bolo, mas ninguém nunca concorda em como cortar direito.",
    "charada2": "Sou meio a meio, tipo aquele acordo de pizza que nunca é justo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "função",
    "charada": "Recebo uma entrada, devolvo uma saída, e ainda assim ninguém confia em mim sem conferir duas vezes.",
    "charada2": "Também sou aquele evento chique que ninguém quer ir, mas todo mundo confirma presença.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "geometria",
    "charada": "A parte da matemática que finge que a vida é feita só de formas perfeitas.",
    "charada2": "Ensino ângulo e área, mas nunca ensino a estacionar o carro dentro da vaga certa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "gráfico",
    "charada": "Consigo fazer qualquer notícia parecer mais dramática só mudando onde o eixo começa.",
    "charada2": "Também sou a novela que sobe de audiência bem no capítulo que todo mundo já sabia o final.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "juros",
    "charada": "A razão de parcelar em 12x parecer uma boa ideia até o extrato chegar.",
    "charada2": "Cresço sozinho todo mês, sem pedir licença e sem avisar com antecedência.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "largura",
    "charada": "Ninguém nunca mede direito antes de tentar passar o sofá pela porta.",
    "charada2": "Meço o quanto, mas nunca meço a paciência de quem tá tentando estacionar na vaga apertada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "média",
    "charada": "A nota que decide se você repete de ano ou faz aquela última prova puxada.",
    "charada2": "Também sou aquele papo de 'mais ou menos', que ninguém sabe se é elogio ou reclamação.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "medida",
    "charada": "Sem mim, todo mundo jura que a calça ainda serve.",
    "charada2": "Provo que a receita da vovó nunca tinha xícara padronizada, só 'olho'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "metade",
    "charada": "Sempre sobra pro outro quando é hora de dividir a pizza.",
    "charada2": "Também sou aquele fone que só funciona de um lado, bem na hora que você mais precisa dos dois.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "moda",
    "charada": "O número que mais aparece, tipo aquela desculpa que todo mundo usa quando se atrasa.",
    "charada2": "Também sou aquela roupa que sai de linha e, dez anos depois, volta como 'tendência retrô'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "multiplicação",
    "charada": "A tabuada que ninguém decorou direito, mas todo mundo finge que sim.",
    "charada2": "Multiplico rápido no papel, mas nunca multiplico o tempo livre do fim de semana.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "número",
    "charada": "Existo em quantidade suficiente pra você nunca mais confiar de olho no troco do mercado.",
    "charada2": "Bato à porta em toda fila de banco, e ninguém nunca gosta de ouvir o meu.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "perímetro",
    "charada": "A volta toda que você dá no quarteirão fingindo que está fazendo exercício.",
    "charada2": "Também sou aquela conversa que dá voltas e voltas sem nunca chegar no assunto principal.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "peso",
    "charada": "A única coisa que a balança do banheiro sempre acha uma desculpa pra aumentar.",
    "charada2": "Também sou aquele climão que ninguém quer carregar depois de uma indireta mal dada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "polígono",
    "charada": "Tenho vários lados, que nem toda discussão de família no grupo do WhatsApp.",
    "charada2": "Ganho mais um lado a cada nome novo, tipo aquele grupo de família que nunca para de crescer.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "porcentagem",
    "charada": "Apareço toda vez que alguém quer fingir que um desconto é maior do que é.",
    "charada2": "Prometo 100% de chance de chuva, e ainda assim ninguém sai de casa com guarda-chuva.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "probabilidade",
    "charada": "A razão de todo mundo achar que vai ganhar na loteria dessa vez.",
    "charada2": "Digo que é pouco provável, e mesmo assim é sempre o que acontece com você.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "proporção",
    "charada": "Ninguém tira foto de comida sem tentar me manipular a favor do prato.",
    "charada2": "Também sou aquela fofoca que cresce um pouco a cada pessoa que conta pra frente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "quadrado",
    "charada": "Tenho quatro lados iguais, e ainda assim chamam alguém sem noção de 'mais quadrado que eu'.",
    "charada2": "Também sou aquele parente que só sabe falar de boato requentado, sempre do mesmo jeito.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "raiz",
    "charada": "Debaixo da terra ou dentro de mim, ninguém gosta de ficar cavando até me encontrar.",
    "charada2": "Sou o motivo de toda calculadora ganhar um botão só pra mim, e mesmo assim ninguém confia de cabeça.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "retângulo",
    "charada": "Sou tipo um quadrado que decidiu esticar um pouco os braços.",
    "charada2": "Também sou o formato de toda tela que você já quebrou pelo menos uma vez na vida.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "sequência",
    "charada": "Netflix pergunta se você ainda está assistindo bem no meio de mim.",
    "charada2": "Também sou aquele áudio de WhatsApp que vem em cinco partes e ninguém escuta na ordem certa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "soma",
    "charada": "Junto duas quantias e sempre sobra alguém no grupo do rango achando que pagou a mais.",
    "charada2": "Também sou aquele resumo de fim de mês que sempre dá menos do que devia.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "subtração",
    "charada": "O que sobra na carteira depois que você jura que ia economizar esse mês.",
    "charada2": "Tiro um número do outro, e ainda assim ninguém confia sem contar duas vezes nos dedos.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "tabela",
    "charada": "Organizo tudo em linhas e colunas, menos a vida de quem promete se organizar.",
    "charada2": "Também sou aquela planilha que prometem atualizar toda semana e nunca atualizam.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "triângulo",
    "charada": "Tenho três lados e ainda assim sou o instrumento mais esquecido da banda da escola.",
    "charada2": "Também sou o desenho que qualquer criança faz pra representar 'casa' sem nem tentar caprichar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "vértice",
    "charada": "O canto onde dois lados se encontram, tipo você e aquele parente chato na mesma festa.",
    "charada2": "Também sou aquele momento exato em que a conversa vira discussão, sem ninguém perceber a hora.",
    "charada2_status": "OK"
  },
  {
    "topico": "Matemática",
    "palavra": "volume",
    "charada": "Some no controle remoto bem na hora que o comercial começa mais alto que o programa.",
    "charada2": "Também sou aquele espaço que a mala nunca tem quando a viagem é de duas semanas.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "aceleração",
    "charada": "O que todo mundo faz no último quilômetro só pra não perder o compromisso que já está atrasado.",
    "charada2": "Aperto o passo quando o sinal fecha, e ainda assim chego atrasado igual todo mundo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "atração",
    "charada": "Faz dois corpos se aproximarem, e também é a desculpa de qualquer paquera capenga.",
    "charada2": "Também sou o motivo de dois ímãs vizinhos na geladeira nunca ficarem separados.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "atrito",
    "charada": "A razão de você escorregar justo quando tem gente olhando.",
    "charada2": "Também sou aquele barulho de sapato novo no chão que todo mundo escuta menos você.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "calor",
    "charada": "A desculpa nacional pra não fazer absolutamente nada em janeiro.",
    "charada2": "Também sou a razão do ventilador virar item essencial de casa em dezembro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "campo",
    "charada": "Onde o time de futebol do bairro sempre jura que ia ganhar esse ano.",
    "charada2": "Também sou o time inteiro discordando da escalação, sem ninguém perguntar ao técnico.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "circuito",
    "charada": "Preciso estar fechado pra funcionar, que nem aquela roda de amigos que nunca deixa ninguém novo entrar.",
    "charada2": "Também sou aquele fio de fone que insiste em dar nó sozinho no bolso.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "corrente",
    "charada": "Passa pelo fio, e também é a razão de você nunca lembrar a senha do wifi de cor.",
    "charada2": "Também sou aquele grupo de amigos que só se junta de novo quando alguém casa ou morre.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "eco",
    "charada": "Repito o que você gritou na montanha, mas nunca respondo quando te chamam pra lavar louça.",
    "charada2": "Também sou a sala vazia depois que a festa acaba e só sobra o barulho da louça.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "eletricidade",
    "charada": "Falta justo quando o capítulo da novela está no ápice.",
    "charada2": "Também sou o motivo do prédio inteiro descobrir quem tem gerador.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "energia",
    "charada": "Falta justo na hora que você mais precisa dela, tipo numa segunda-feira de manhã.",
    "charada2": "Também sou aquela que a criança tem de sobra às 22h, bem na hora de dormir.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "espaço",
    "charada": "O motivo de você nunca conseguir estacionar o carro igual ao vizinho.",
    "charada2": "Também sou o motivo da van do transporte escolar sempre jurar que cabe mais um.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "força",
    "charada": "A desculpa de quem não consegue abrir o pote de azeitona sozinho.",
    "charada2": "Também sou o nome que dão pra qualquer academia que promete resultado em um mês.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "gravidade",
    "charada": "A única força que nunca tira folga, nem nos fins de semana.",
    "charada2": "Também sou a palavra usada quando alguém tenta minimizar um problema sério dizendo 'não é nada demais'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "ímã",
    "charada": "Atrai o metal, e também atrai foto de viagem que ninguém tira mais direito.",
    "charada2": "Também sou aquele que gruda mais lembrancinha de viagem na geladeira do que espaço realmente sobra.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "inércia",
    "charada": "A vontade de continuar deitado no sofá exatamente como você já estava.",
    "charada2": "Também sou o motivo de todo mundo prometer academia em janeiro e sumir em fevereiro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "luz",
    "charada": "Apaga bem na cena mais assustadora do filme, nunca antes.",
    "charada2": "Também sou a primeira coisa que o vizinho reclama quando fica acesa até tarde.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "massa",
    "charada": "A desculpa científica de por que o pão não flutua na sua frente.",
    "charada2": "Também sou aquela que sobra na mão depois que a receita de pão pede 'sove até ficar lisinha'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "movimento",
    "charada": "Sem mim, a academia perderia a única coisa que justifica a mensalidade.",
    "charada2": "Também sou o nome de qualquer campanha que promete mudar tudo e vira só figurinha de status.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "onda",
    "charada": "Chega, some, e sempre te pega de calças curtas justo na praia.",
    "charada2": "Também sou aquele boato que sobe rápido e ninguém lembra quem começou.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "óptica",
    "charada": "Estudo a luz e as ilusões, tipo aquele espelho de provador que sempre mente pra você.",
    "charada2": "Também sou o motivo de todo espelho de loja te fazer parecer mais alto que na vida real.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "potência",
    "charada": "Quanto mais alta a minha, mais rápido a conta de luz assusta no fim do mês.",
    "charada2": "Também sou o argumento pra justificar comprar o carro mais caro da concessionária.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "pressão",
    "charada": "Sobe quando o chefe manda mensagem sexta às 18h.",
    "charada2": "Também sou aquela que sobe quando alguém liga perguntando 'cadê o relatório?'",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "refração",
    "charada": "Faço um lápis parecer quebrado dentro d'água, sem nunca quebrar nada de verdade.",
    "charada2": "Também sou o motivo de o canudo parecer torto assim que entra no copo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "resistência",
    "charada": "Quanto mais eu tenho, mais difícil a corrente passa, e mais difícil você aceitar um não.",
    "charada2": "Também sou a última força de vontade antes de repetir o prato no rodízio.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "som",
    "charada": "Baixa sozinho assim que o professor começa a falar algo importante.",
    "charada2": "Também sou o motivo do vizinho ligar o carro de madrugada só pra 'esquentar o motor'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "temperatura",
    "charada": "Discussão eterna de quem controla o ar-condicionado do escritório.",
    "charada2": "Também sou a primeira pergunta de qualquer mãe assim que alguém diz 'acho que tô ficando doente'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "tempo",
    "charada": "Some rápido demais quando é fim de semana, e devagar demais numa reunião chata.",
    "charada2": "Também sou o assunto reserva de qualquer conversa de elevador quando ninguém tem mais nada a dizer.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "vácuo",
    "charada": "Lugar onde não existe nada, parecido com sua cabeça segunda de manhã antes do café.",
    "charada2": "Também sou aquele aparelho de limpar casa que promete facilidade e fica preso embaixo do sofá.",
    "charada2_status": "OK"
  },
  {
    "topico": "Física",
    "palavra": "velocidade",
    "charada": "O motivo de toda lombada existir.",
    "charada2": "Também sou o motivo de toda internet 'turbo' nunca parecer turbo o suficiente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "ácido",
    "charada": "A razão do seu estômago reclamar depois daquele lanche às 2 da manhã.",
    "charada2": "Também sou o comentário de quem sempre acha um jeito de estragar o clima de qualquer conversa boa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "água",
    "charada": "Prometem que você deveria beber mais de mim o dia inteiro, e ninguém cumpre.",
    "charada2": "Também sou o motivo de toda garrafinha reutilizável ficar esquecida na bolsa, vazia, há dias.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "átomo",
    "charada": "Tão pequeno que ninguém nunca viu, e mesmo assim vive sendo citado em conversa de bar sobre o universo.",
    "charada2": "Também sou usado pra descrever qualquer chance mínima, tipo 'nem um átomo de paciência sobrou'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "base",
    "charada": "Meu oposto é ácido, e assim como toda discussão de política, a gente nunca concorda no meio termo.",
    "charada2": "Também sou aquela camada de maquiagem que promete durar o dia todo e não dura nem até o almoço.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "carbono",
    "charada": "Estou em todo ser vivo, e também na desculpa de todo mundo pra reduzir a pegada.",
    "charada2": "Também sou citado toda vez que alguém quer parecer consciente sem mudar nenhum hábito de verdade.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "combustão",
    "charada": "Preciso de oxigênio pra acontecer, que nem aquela fofoca que só pega fogo com plateia.",
    "charada2": "Também sou o motivo de churrasco sempre ter alguém se achando expert em acender carvão.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "composto",
    "charada": "Feito de mais de um elemento, que nem aquela receita de família que ninguém sabe explicar direito.",
    "charada2": "Também sou o nome de qualquer remédio de bula gigante que ninguém lê até o fim.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "concentração",
    "charada": "Quanto mais eu tenho numa solução, mais forte ela fica, e é exatamente o que falta em você numa reunião de segunda.",
    "charada2": "Também sou a primeira coisa que qualquer notificação de celular consegue quebrar em meio segundo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "cristal",
    "charada": "Organizado até nos átomos, ao contrário do seu quarto.",
    "charada2": "Também sou o nome chique que dão pro copo caro que ninguém pode usar no dia a dia.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "elemento",
    "charada": "Tenho uma tabela inteira dedicada a mim, e ainda assim ninguém decora além de uns 5.",
    "charada2": "Também sou usado pra dizer que alguém é 'suspeito' numa festa sem provar nada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "ferro",
    "charada": "Deixo a roupa lisinha, e também deixo o detector do aeroporto apitando bem na sua vez.",
    "charada2": "Também sou aquele eletrodoméstico que só sai do armário quando a roupa já tá quase no prazo de usar, amassada mesmo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "fórmula",
    "charada": "Todo mundo decora a minha e esquece pra que ela serve dois dias depois da prova.",
    "charada2": "Também sou usada pra chamar qualquer plano infalível que nunca funciona igual da segunda vez.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "gás",
    "charada": "Escapo da panela de pressão bem na hora que você tira os olhos dela.",
    "charada2": "Também sou aquele que acaba do botijão bem no meio do banho mais gelado do ano.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "hidrogênio",
    "charada": "O elemento mais simples da tabela, mas ninguém lembra de mim até a aula sobre a água.",
    "charada2": "Também dou nome à bomba que ninguém quer ver de perto, nem na aula de história.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "íon",
    "charada": "Um átomo que perdeu ou ganhou elétron, tipo você depois de uma treta no grupo da família.",
    "charada2": "Também sou usado pra design de nome de carro elétrico querendo parecer futurista.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "líquido",
    "charada": "Me ajeito em qualquer copo, ao contrário da sua vida financeira.",
    "charada2": "Também sou o estado do seu salário por volta do dia 20 de cada mês.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "metal",
    "charada": "Faz o detector de aeroporto apitar justo em você, nunca na pessoa da frente.",
    "charada2": "Também sou o gênero de música que o adolescente da casa liga bem alto pra incomodar todo mundo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "mistura",
    "charada": "Junto duas coisas sem virar uma terceira, tipo arroz com feijão que nunca vira arroz-feijão de vez.",
    "charada2": "Também sou aquele grupo de amigos formado só porque todo mundo tinha alguém em comum.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "molécula",
    "charada": "Pequena demais pra você ver, grande o suficiente pra decidir se seu perfume é bom.",
    "charada2": "Também sou usada em qualquer propaganda de creme pra parecer mais científica do que realmente é.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "nitrogênio",
    "charada": "Sou a maior parte do ar que você respira, e ainda assim ninguém nunca fala de mim numa conversa de elevador.",
    "charada2": "Também sou usado pra deixar sorvete de restaurante chique parecendo experimento de laboratório.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "oxigênio",
    "charada": "A única coisa que todo mundo concorda que é essencial, e mesmo assim ninguém agradece por ela.",
    "charada2": "Também sou a desculpa clássica pra sair andando rápido de qualquer climão familiar: 'vou tomar um ar'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "reação",
    "charada": "O motivo de todo experimento de escola prometer fumaça e nunca entregar.",
    "charada2": "Também sou o nome de qualquer vídeo de internet onde alguém só assiste outro vídeo e comenta.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "sal",
    "charada": "Aquele que sempre falta bem na hora que a comida já está pronta.",
    "charada2": "Também sou aquele que satura completamente qualquer pipoca de cinema.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "sólido",
    "charada": "A única coisa que seu argumento numa discussão de família raramente é.",
    "charada2": "Também sou usado pra elogiar plano de vida que na prática ninguém seguiu até o fim do mês.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "solução",
    "charada": "Sempre pareço óbvia depois que alguém já te falou qual sou.",
    "charada2": "Também sou aquela resposta óbvia que só aparece depois que você já brigou horas sobre o problema.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "solvente",
    "charada": "Dissolvo qualquer coisa, menos aquela mancha teimosa que já virou parte da camisa.",
    "charada2": "Também sou usado em qualquer removedor de esmalte que deixa cheiro forte no cômodo inteiro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "substância",
    "charada": "Toda embalagem de produto de limpeza me esconde atrás de um nome que ninguém consegue pronunciar.",
    "charada2": "Também sou usada pra elogiar argumento de alguém, tipo 'isso tem substância', o resto normalmente não tem.",
    "charada2_status": "OK"
  },
  {
    "topico": "Química",
    "palavra": "vapor",
    "charada": "Saio da panela e embaço o espelho bem na hora que você mais precisa se ver antes de sair.",
    "charada2": "Também sou a razão do espelho do banheiro nunca deixar você se ver direito logo depois do banho quente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "animal",
    "charada": "Categoria que inclui você, mesmo que sua timeline discorde.",
    "charada2": "Também sou usado pra xingar alguém que corta fila sem pedir licença.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "bactéria",
    "charada": "Vive numa maçaneta que ninguém nunca limpa direito.",
    "charada2": "Também sou a razão do celular do banheiro público parecer o objeto mais sujo do planeta.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "célula",
    "charada": "Tão pequena que ninguém vê, e mesmo assim sou citada em toda propaganda de creme anti-idade.",
    "charada2": "Também sou o nome de qualquer cadeia, presídio ou aquele quartinho de bagunça lá de casa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "cérebro",
    "charada": "Trabalha o dia inteiro sem parar, e mesmo assim esquece onde você colocou a chave de casa.",
    "charada2": "Também sou o apelido de quem sempre resolve o problema técnico da família de graça.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "coração",
    "charada": "Dispara sozinho quando o crush curte sua última foto.",
    "charada2": "Também sou o emoji mais usado pra fingir concordar com uma foto que você nem olhou direito.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "corpo",
    "charada": "A coisa que você promete cuidar melhor toda segunda-feira de janeiro.",
    "charada2": "Também sou o motivo de toda roupa nova parecer mais apertada depois do fim de semana.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "digestão",
    "charada": "A razão de ninguém querer correr logo depois do almoço de domingo.",
    "charada2": "Também sou usada como desculpa pra tirar uma soneca logo depois do almoço.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "doença",
    "charada": "Sempre aparece na sexta-feira à noite, nunca durante a semana de trabalho.",
    "charada2": "Também sou o motivo de todo grupo de trabalho ficar sem resposta numa sexta-feira.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "ecossistema",
    "charada": "Um equilíbrio que se desfaz completamente quando um mosquito entra no seu quarto às 3 da manhã.",
    "charada2": "Também sou usado pra descrever qualquer grupo de amigos com uma dinâmica complicada demais de explicar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "espécie",
    "charada": "Categoria que agrupa seres tão diferentes quanto você e seu primo que só aparece no Natal.",
    "charada2": "Também sou usada pra classificar aquele tipo raro de pessoa que responde mensagem na hora.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "evolução",
    "charada": "Levei milhões de anos pra chegar no polegar, e você ainda erra ao digitar no celular.",
    "charada2": "Também sou o nome de qualquer atualização de celular que promete melhorar e deixa mais lento.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "fotossíntese",
    "charada": "O processo que faz a planta comer luz do sol, coisa que você nunca conseguiu fazer nem com café.",
    "charada2": "Também sou citada toda vez que alguém tenta explicar por que devia ter mais plantas em casa e nunca rega nenhuma.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "fungo",
    "charada": "Cresço em qualquer lugar úmido, inclusive naquele pote de comida esquecido na geladeira.",
    "charada2": "Também sou a razão do pão de forma esquecido virar arte moderna em três dias.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "gene",
    "charada": "A desculpa perfeita pra herdar o mau humor de manhã da família.",
    "charada2": "Também sou usado pra justificar por que a família inteira chega atrasada em tudo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "habitat",
    "charada": "O lugar onde cada bicho vive, e também o motivo de reclamarem quando você invade o quarto do outro sem bater.",
    "charada2": "Também sou usado pra descrever o quarto de quem nunca deixa ninguém entrar sem avisar antes.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "hormônio",
    "charada": "A desculpa perfeita pra explicar qualquer mudança de humor repentina.",
    "charada2": "Também sou culpado por aquela vontade repentina de doce às 23h de uma terça qualquer.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "músculo",
    "charada": "Prometido em janeiro, esquecido em fevereiro, junto com a inscrição da academia.",
    "charada2": "Também sou o motivo de toda foto de academia vir acompanhada de legenda motivacional.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "natureza",
    "charada": "Chama você pra um passeio e depois te lembra que existe wi-fi em casa.",
    "charada2": "Também sou o cenário perfeito de toda foto que esconde o quanto o passeio foi cansativo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "órgão",
    "charada": "Cada um de nós tem uma função, menos aquele que ninguém sabe pra que serve até o médico explicar.",
    "charada2": "Também sou usado pra chamar qualquer autoridade que ninguém sabe bem o que decide de verdade.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "osso",
    "charada": "Aguento o corpo inteiro de pé, e ainda assim ninguém me agradece até doer.",
    "charada2": "Também sou usado pra dizer que alguém 'não dá o braço a torcer' nem depois de perder a discussão.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "planta",
    "charada": "Prometem que sou fácil de cuidar, e mesmo assim toda suculenta da sua casa já morreu.",
    "charada2": "Também sou usada pra decorar reunião de trabalho, sempre de plástico, sempre empoeirada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "proteína",
    "charada": "Prometo músculo pra quem toma, mas o shaker sujo na pia é a única coisa que realmente aparece.",
    "charada2": "Também sou o primeiro assunto de qualquer conversa sobre dieta que dura só até sexta-feira.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "pulmão",
    "charada": "Trabalho o tempo todo sem parar, e mesmo assim sou o primeiro a reclamar quando você sobe uma escada.",
    "charada2": "Também sou usado pra descrever quem grita o time inteiro do campo desde a arquibancada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "reprodução",
    "charada": "O assunto da aula que fazia todo mundo olhar pro teto fingindo interesse no ventilador.",
    "charada2": "Também sou o nome do botão que todo mundo aperta de novo achando que vai mudar o final do episódio.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "respiração",
    "charada": "Automática até alguém te lembrar dela, e então você não consegue parar de pensar nela.",
    "charada2": "Também sou a primeira coisa que esquecem de fazer direito na fila do banco quando o número não anda.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "sangue",
    "charada": "Sobe na cabeça bem na hora que alguém mexe com você no grupo da família.",
    "charada2": "Também sou usado pra descrever qualquer disputa boba de jogo de tabuleiro em família.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "saúde",
    "charada": "Só vira prioridade de verdade depois que alguém te dá um susto no consultório.",
    "charada2": "Também sou o brinde mais repetido em qualquer aniversário de família, mesmo sem ninguém erguer a taça de verdade.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "vacina",
    "charada": "Uma picadinha rápida que sempre vem acompanhada de choro, seu ou de alguém do lado.",
    "charada2": "Também sou motivo de discussão de grupo de zap que ninguém consegue encerrar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "vida",
    "charada": "A única coisa que ninguém consegue devolver depois de reclamar dela o dia inteiro.",
    "charada2": "Também sou o nome do jogo de tabuleiro que sempre acaba em discussão antes do fim.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "vírus",
    "charada": "Se espalha mais rápido que fofoca de grupo de WhatsApp da família.",
    "charada2": "Também sou usado pra descrever aquele vídeo de gato que todo mundo compartilha no mesmo dia.",
    "charada2_status": "OK"
  },
  {
    "topico": "Biologia",
    "palavra": "vitamina",
    "charada": "Existo na fruta, mas todo mundo prefere me tomar em comprimido mesmo assim.",
    "charada2": "Também sou usada pra vender suco de caixinha como se fosse remédio milagroso.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "batalha",
    "charada": "Aquele confronto que os livros descrevem em páginas inteiras, mas que na vida real dura só alguns minutos.",
    "charada2": "Também sou usada pra descrever a fila do banco às vésperas do feriado.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "colônia",
    "charada": "Território emprestado que o dono original nunca mais devolveu de bom grado.",
    "charada2": "Também sou o nome de qualquer perfume que promete durar o dia inteiro e não dura.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "conquista",
    "charada": "Tomar posse de um território, ou aquela sensação de finalmente estacionar numa vaga difícil.",
    "charada2": "Também sou usada quando alguém finalmente arruma a gaveta que estava bagunçada há meses.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "constituição",
    "charada": "O documento que organiza as regras do país, tipo aquele regulamento do condomínio que ninguém lê até dar problema.",
    "charada2": "Também sou usada pra descrever o físico de quem treina há um mês e já se acha atleta.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "democracia",
    "charada": "Onde todo mundo vota, e depois metade reclama do resultado do mesmo jeito.",
    "charada2": "Também sou o método usado pra escolher o restaurante do grupo, mesmo sabendo que ninguém vai ficar satisfeito.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "ditador",
    "charada": "A pessoa que numa reunião de amigos decide o restaurante sem perguntar pra ninguém.",
    "charada2": "Também sou o apelido de quem sempre escolhe o filme sem perguntar a mais ninguém.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "ditadura",
    "charada": "Quando uma pessoa só decide tudo, tipo aquele parente que manda no controle remoto.",
    "charada2": "Também sou o nome informal de qualquer chefia que decide escala de férias sem consultar ninguém.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "eleição",
    "charada": "O dia em que todo mundo lembra que tem opinião política forte, só esse dia.",
    "charada2": "Também sou usada pra escolher quem lava a louça, sempre no grito, nunca por voto de verdade.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "era",
    "charada": "Um pedacinho enorme do tempo que os livros adoram nomear com uma palavra só.",
    "charada2": "Também sou usada pra descrever qualquer geração culpando a anterior por tudo.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "escravidão",
    "charada": "A página mais pesada de qualquer livro didático, e a que menos tempo de aula recebe.",
    "charada2": "Também sou citada quando alguém exagera reclamando de ter que lavar um prato só.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "escravo",
    "charada": "A prova mais dolorosa de que o passado de um país nunca sai completamente das contas do presente.",
    "charada2": "Também sou usado, errado e sem noção nenhuma, pra reclamar de qualquer tarefa chata de casa.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "evento",
    "charada": "Aquilo que todo mundo marca no calendário e esquece de verdade duas semanas antes.",
    "charada2": "Também sou aquele que todo mundo confirma presença e cancela em cima da hora.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "golpe",
    "charada": "Quando alguém toma o poder sem pedir licença, ou aquela dor no dedão quando bate na quina da cama.",
    "charada2": "Também sou o nome de qualquer mensagem de banco falso pedindo seus dados no celular.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "governo",
    "charada": "Sempre culpado no bar, elogiado nunca.",
    "charada2": "Também sou culpado quando o sinal de trânsito demora mais que o normal pra abrir.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "guerra",
    "charada": "Começo por um motivo pequeno e termino virando capítulo de livro que ninguém quer estudar pra prova.",
    "charada2": "Também sou usada pra descrever qualquer discussão boba de jogo de videogame em família.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "imigrante",
    "charada": "Quem sai de um lugar em busca de uma vida melhor, e ainda assim é o primeiro a defender o time local de futebol.",
    "charada2": "Também sou aquele que chega numa cidade nova e diz que lá o pão era melhor.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "império",
    "charada": "Tão grande que até hoje apareço em nome de restaurante querendo parecer chique.",
    "charada2": "Também sou usado no nome de qualquer academia que promete resultado em 30 dias.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "independência",
    "charada": "O dia em que um país decide que não precisa mais pedir permissão pra ninguém.",
    "charada2": "Também sou o dia em que o adolescente finalmente decide lavar a própria roupa sem pedir.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "monarquia",
    "charada": "Governo de família que passa o cargo de pai pra filho, tipo herança de bar de esquina.",
    "charada2": "Também sou usada pra descrever a família em que só uma pessoa decide o cardápio do Natal, sempre.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "povo",
    "charada": "A galera inteira, incluindo você reclamando do trânsito hoje de manhã.",
    "charada2": "Também sou usado pra dizer que 'todo mundo' concordou com algo que na real ninguém foi consultado.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "presidente",
    "charada": "A pessoa que todo mundo culpa no boteco, mesmo sem saber direito o que ela faz.",
    "charada2": "Também sou o apelido de quem sempre se mete a organizar o churrasco sem ninguém pedir.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "rei",
    "charada": "Nasci com o cargo garantido, sem nunca precisar mandar currículo.",
    "charada2": "Também sou o título que todo pai se dá quando conquista o controle remoto de volta.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "república",
    "charada": "O tipo de governo que faz todo mundo brigar em grupo de família no dia da eleição.",
    "charada2": "Também sou o nome de qualquer casa de estudante com regra de limpeza que nunca é seguida.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "revolta",
    "charada": "Começo com um grupo cansado de aguentar calado, tipo o vizinho depois do terceiro churrasco barulhento seguido.",
    "charada2": "Também sou o sentimento de quem descobre que o cinema aumentou o preço da pipoca de novo.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "revolução",
    "charada": "Todo mundo promete fazer uma na segunda-feira, e a academia continua vazia.",
    "charada2": "Também sou o nome de qualquer produto de propaganda que promete mudar sua vida em uma semana.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "século",
    "charada": "Cem anos, ou o tempo que parece ter passado desde a última vez que o wifi de casa funcionou direito.",
    "charada2": "Também sou usado pra exagerar o tempo que você esperou por uma resposta de mensagem.",
    "charada2_status": "OK"
  },
  {
    "topico": "História",
    "palavra": "tratado",
    "charada": "Um papel assinado prometendo paz, que nem aquele combinado de família que dura até o próximo Natal.",
    "charada2": "Também sou usado pra chamar qualquer acordo de família sobre quem paga a conta do restaurante.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "ambiente",
    "charada": "Tudo ao redor que a gente promete cuidar melhor, geralmente depois de assistir um documentário.",
    "charada2": "Também sou usado pra descrever qualquer escritório com clima estranho depois de uma reunião ruim.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "bússola",
    "charada": "Aponto sempre pro norte, ao contrário de qualquer decisão que você tenta tomar sozinho.",
    "charada2": "Também sou o app de GPS que insiste em recalcular a rota mesmo você seguindo certinho.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "capital",
    "charada": "A cidade que todo mundo sabe o nome mesmo sem nunca ter visitado.",
    "charada2": "Também sou usada pra descrever aquele dinheiro guardado que some rápido assim que aparece uma promoção.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "chuva",
    "charada": "Sempre decido cair bem na hora que você esqueceu o guarda-chuva em casa.",
    "charada2": "Também sou a desculpa perfeita pra cancelar qualquer plano de última hora.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "cidade",
    "charada": "Cheia de gente, e mesmo assim você sente falta de alguém pra conversar.",
    "charada2": "Também sou o assunto de quem se muda e não para de comparar tudo com o lugar antigo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "clima",
    "charada": "Sempre o primeiro assunto de conversa quando ninguém tem mais nada pra falar.",
    "charada2": "Também sou usado pra descrever o ambiente estranho depois de uma indireta mal recebida.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "continente",
    "charada": "Grande o suficiente pra caber um país inteiro que você nem sabia que existia.",
    "charada2": "Também sou usado, errado, pra exagerar distância de qualquer bairro mais afastado da cidade.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "deserto",
    "charada": "O lugar mais seco do mundo, e ainda assim mais organizado que sua geladeira no fim do mês.",
    "charada2": "Também sou usado pra descrever a geladeira dias antes de ir ao mercado.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "floresta",
    "charada": "Cheia de árvores que produzem o oxigênio que você respira sem nunca agradecer.",
    "charada2": "Também sou o nome de qualquer parque que a prefeitura promete reformar todo ano.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "fronteira",
    "charada": "A linha que dois países discutem, mas que o GPS do celular já decidiu sozinho.",
    "charada2": "Também sou usada pra marcar até onde vai a paciência de qualquer pai numa viagem longa de carro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "ilha",
    "charada": "Cercada de água por todo lado, que nem você depois de cancelar todos os compromissos do fim de semana.",
    "charada2": "Também sou o nome do fogão, sempre lotada de louça suja bem no meio da bancada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "latitude",
    "charada": "Uma linha imaginária que decide se seu verão vai ser de praia ou de casaco.",
    "charada2": "Também sou usada, errada, por qualquer um tentando parecer que entende de geografia numa conversa de bar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "litoral",
    "charada": "A faixa de terra que todo mundo lota em janeiro e esquece o resto do ano.",
    "charada2": "Também sou o assunto principal de qualquer conversa de dezembro em diante.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "mapa",
    "charada": "Prometo o caminho mais rápido e te levo direto pro trânsito parado.",
    "charada2": "Também sou usado pra descrever qualquer plano detalhado que muda assim que a viagem realmente começa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "migração",
    "charada": "Sair de um lugar pra outro em busca de coisa melhor, que nem passarinho ou aquele primo que foi tentar a vida em outra cidade.",
    "charada2": "Também sou usada pra descrever quando todo mundo do grupo muda de rede social ao mesmo tempo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "montanha",
    "charada": "O tamanho que qualquer problema pequeno vira na sua cabeça às 3 da manhã.",
    "charada2": "Também sou usada pra descrever a pilha de roupa suja que cresce até o fim de semana.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "oceano",
    "charada": "Grande demais pra atravessar nadando, mas pequeno o suficiente pra sumir com seu chinelo na primeira onda.",
    "charada2": "Também sou usado, exagerado, pra descrever qualquer distância entre você e a geladeira às 3 da manhã.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "país",
    "charada": "Tenho bandeira, hino e um grupo de WhatsApp inteiro discutindo política sobre mim.",
    "charada2": "Também sou usado pra dizer que 'lá fora é tudo melhor', mesmo sem nunca ter saído do bairro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "planeta",
    "charada": "Sua casa inteira, girando sem parar, e ainda assim ninguém sente a velocidade.",
    "charada2": "Também sou usado pra dizer que alguém 'vive em outro mundo' quando ignora completamente a real.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "poluição",
    "charada": "O motivo do rio que era limpo na foto antiga da vovó não existir mais assim hoje.",
    "charada2": "Também sou usada pra descrever qualquer notificação inútil lotando a tela do celular.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "população",
    "charada": "Todo mundo, incluindo aquele vizinho que você nunca viu a cara.",
    "charada2": "Também sou usada pra exagerar quantas pessoas realmente foram na festa de aniversário.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "região",
    "charada": "Um pedaço do mapa que reclama que ninguém fala o sotaque dele direito na TV.",
    "charada2": "Também sou usada, num tom de deboche, pra apontar o sotaque de quem é de outro estado.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "relevo",
    "charada": "A razão de a bicicleta ficar bem mais cansativa na volta pra casa.",
    "charada2": "Também sou usado pra descrever a cara de quem finalmente termina uma prova difícil.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "rio",
    "charada": "Corro sem parar, ao contrário de você numa segunda de manhã.",
    "charada2": "Também sou usado, sem d, pra descrever a risada de quem contou a própria piada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "solo",
    "charada": "Onde tudo cresce, inclusive aquela grama que você promete cortar todo fim de semana.",
    "charada2": "Também sou usado pra descrever quem faz uma apresentação sozinho sem ninguém pra dividir o nervosismo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "terremoto",
    "charada": "Balanço o chão inteiro sem avisar, igual susto de notificação de banco de madrugada.",
    "charada2": "Também sou usado pra descrever o susto de qualquer notificação de cobrança inesperada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "território",
    "charada": "A linha imaginária que faz duas pessoas brigarem por um metro de terreno.",
    "charada2": "Também sou usado pra marcar até onde vai o lado da cama que cada um pode usar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "vale",
    "charada": "O ponto mais baixo entre duas montanhas, e também o motivo de a bicicleta parecer fácil só na descida.",
    "charada2": "Também sou usado, sem crase, no nome de qualquer cupom que expira antes de você lembrar de usar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "vento",
    "charada": "Viro sua sombrinha do avesso sem pedir licença.",
    "charada2": "Também sou usado pra descrever quem muda de ideia rápido demais numa conversa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Geografia",
    "palavra": "vulcão",
    "charada": "Fico quieto por anos e depois exploso do nada, que nem aquele parente numa discussão de família.",
    "charada2": "Também sou usado pra descrever qualquer pessoa calma até alguém mexer no prato dela.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "adjetivo",
    "charada": "Dou qualidade a um substantivo, tipo aquele elogio que sua mãe manda com segunda intenção.",
    "charada2": "Também sou usado em excesso em qualquer legenda de foto de viagem.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "antônimo",
    "charada": "O oposto exato de uma palavra, igual você e aquele parente que discorda de tudo só por discordar.",
    "charada2": "Também sou usado pra descrever o humor de alguém antes e depois do café da manhã.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "autor",
    "charada": "A pessoa que decide o final da história antes de você, e nunca avisa com antecedência.",
    "charada2": "Também sou o crédito que ninguém lembra de dar quando repassa uma frase boa pra frente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "clímax",
    "charada": "O momento mais tenso da história, bem antes do final que todo mundo já desconfiava.",
    "charada2": "Também sou usado pra descrever o momento exato em que a churrasqueira finalmente pega fogo direito.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "conto",
    "charada": "Termino rápido demais, tipo aquele fim de semana bom.",
    "charada2": "Também sou usado pra chamar qualquer história exagerada que cresce cada vez que é contada de novo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "crônica",
    "charada": "Conto um dia comum de um jeito que faz até fila de banco parecer interessante.",
    "charada2": "Também sou usada pra descrever a dor que aparece só quando o tempo esfria.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "enredo",
    "charada": "O motivo de você perder a hora de dormir assistindo 'só mais um episódio'.",
    "charada2": "Também sou usado pra descrever a confusão de qualquer fofoca contada por três pessoas diferentes.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "escrita",
    "charada": "A prova de que você pensou antes de falar, coisa rara nas redes sociais.",
    "charada2": "Também sou a letra que ninguém mais consegue ler direito desde que o teclado apareceu.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "frase",
    "charada": "Quando bem colocada, viro status de rede social por meses.",
    "charada2": "Também sou usada, incompleta, em qualquer discussão de WhatsApp que termina em mal-entendido.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "gramática",
    "charada": "As regras que todo mundo segue errado no WhatsApp e certo só na prova.",
    "charada2": "Também sou usada pra corrigir os outros bem na hora que ninguém pediu opinião.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "leitura",
    "charada": "Prometida toda virada de ano, esquecida já em fevereiro.",
    "charada2": "Também sou usada pra chamar qualquer interpretação errada de mensagem de texto.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "livro",
    "charada": "Prometido pra ser lido em uma semana, viro enfeite de estante por dois anos.",
    "charada2": "Também sou usado como peso de porta desde que ganhei capa dura de presente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "metáfora",
    "charada": "Comparo duas coisas sem usar \"como\", tipo chamar o trânsito de guerra sem ninguém realmente atirar em ninguém.",
    "charada2": "Também sou usada quando alguém não quer falar diretamente que o problema é com você.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "narrador",
    "charada": "Sei de tudo, menos por que ninguém nunca confia totalmente em mim.",
    "charada2": "Também sou o apelido de quem sempre conta a história dos outros com mais detalhes que eles mesmos.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "palavra",
    "charada": "Uma só já é capaz de estragar o clima de qualquer grupo de família.",
    "charada2": "Também sou aquela que falta na hora exata de terminar uma discussão com estilo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "personagem",
    "charada": "Vivo dramas emocionantes sem nunca ter que pagar boleto de verdade.",
    "charada2": "Também sou usado pra chamar alguém que sempre aparece com uma história diferente em cada festa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "poema",
    "charada": "Digo em quatro linhas o que uma pessoa levaria uma noite inteira explicando por mensagem de voz.",
    "charada2": "Também sou usado, sem querer, quando alguém tenta se declarar e trava no meio da frase.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "poesia",
    "charada": "Consigo fazer até uma lista de compras parecer profunda se você quebrar as linhas do jeito certo.",
    "charada2": "Também sou usada pra descrever qualquer legenda de foto do pôr do sol na praia.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "pronome",
    "charada": "Existo pra você não repetir o nome da pessoa cem vezes na mesma fofoca.",
    "charada2": "Também sou trocado errado bem na hora que alguém tenta parecer educado demais.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "protagonista",
    "charada": "Quem vive a história inteira sem nunca precisar dividir os créditos com ninguém.",
    "charada2": "Também sou usado pra descrever quem sempre puxa a história pro próprio lado numa roda de conversa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "rima",
    "charada": "Faço duas palavras diferentes soarem como se fossem feitas uma pra outra.",
    "charada2": "Também sou usada em qualquer propaganda de rádio que gruda na cabeça sem você querer.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "romance",
    "charada": "Sempre mais longo que o namoro que me inspirou.",
    "charada2": "Também sou usado, exagerado, pra descrever qualquer paquera que durou só um final de semana.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "sílaba",
    "charada": "Um pedacinho da palavra, e o motivo de você travar bonito tentando ler um nome esquisito em voz alta.",
    "charada2": "Também sou usada pra separar o nome de bebê que os pais insistem em inventar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "sinônimo",
    "charada": "Uma palavra que significa quase a mesma coisa que outra, tipo dizer \"econômico\" em vez de \"pão-duro\".",
    "charada2": "Também sou usado quando alguém tenta suavizar uma crítica sem perder a educação.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "substantivo",
    "charada": "Dou nome pra tudo, inclusive pra aquela coisa que você não lembra o nome e chama de 'treco'.",
    "charada2": "Também sou usado, sem querer, quando alguém esquece o nome de uma coisa e chama de 'aquilo lá'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "sujeito",
    "charada": "Quem pratica a ação na frase, e também aquele suspeito que sempre aparece em toda história de família mal contada.",
    "charada2": "Também sou usado, num tom de fofoca, pra apontar alguém sem falar o nome.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "texto",
    "charada": "Chego grande no grupo do trabalho e ninguém me lê inteiro antes de responder 'combinado'.",
    "charada2": "Também sou aquele que chega grande demais no grupo do trabalho numa sexta à noite.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "verbo",
    "charada": "A palavra que faz a ação acontecer, mesmo quando você só promete e não faz nada.",
    "charada2": "Também sou o primeiro a sumir quando alguém tenta se explicar depois de errar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "verso",
    "charada": "Uma linha só, mas decido se o poema inteiro vai rimar ou não.",
    "charada2": "Também sou usado, decorado errado, em qualquer letra de música cantada no chuveiro.",
    "charada2_status": "OK"
  },
  {
    "topico": "Português e Literatura",
    "palavra": "vírgula",
    "charada": "Uma pausa pequena que muda o sentido da frase inteira, e também de qualquer herança mal escrita.",
    "charada2": "Também sou aquela que falta bem na hora de ler um contrato até o fim.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "argumento",
    "charada": "Aquilo que todo mundo jura ter na discussão de grupo de família, mas poucos realmente trazem.",
    "charada2": "Também sou usado quando alguém perde a discussão e muda de assunto na hora.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "citação",
    "charada": "Uma frase de outra pessoa que você usa pra parecer mais culto do que realmente é.",
    "charada2": "Também sou usada errada, atribuída à pessoa errada, em quase toda rede social.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "clareza",
    "charada": "A coisa que falta na explicação de qualquer manual de eletrônico.",
    "charada2": "Também sou o que falta em qualquer manual de montar móvel.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "coerência",
    "charada": "A coisa que falta na desculpa de quem chega atrasado dizendo que 'o trânsito estava do nada'.",
    "charada2": "Também sou o que falta na desculpa de quem chega atrasado dizendo motivo diferente toda semana.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "coesão",
    "charada": "O motivo de um texto não parecer um monte de frases jogadas ao acaso, tipo esta explicação aqui.",
    "charada2": "Também sou o que mantém o grupo de amigos junto, mesmo sem ninguém saber explicar por quê.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "conclusão",
    "charada": "Sempre escrita correndo, faltando dois minutos pra acabar o tempo de prova.",
    "charada2": "Também sou aquela que todo mundo já sabia antes mesmo de terminar de ler o resto.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "conectivo",
    "charada": "A palavrinha que costura uma ideia na outra, tipo aquele parente que sempre lembra de puxar assunto na mesa.",
    "charada2": "Também sou a palavra que salva qualquer história mal contada de virar bagunça total.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "crítica",
    "charada": "O comentário que todo mundo faz depois que o problema já não tem mais solução.",
    "charada2": "Também sou aquela que ninguém pede, mas todo mundo dá de graça mesmo assim.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "dissertação",
    "charada": "O tipo de texto em que você precisa parecer seguro de algo que decidiu pensar cinco minutos atrás.",
    "charada2": "Também sou usada pra chamar qualquer explicação longa demais pra uma pergunta simples de sim ou não.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "intervenção",
    "charada": "A proposta de solução que todo mundo escreve no final sem nunca aplicar de verdade na própria vida.",
    "charada2": "Também sou aquela conversa que a família marca quando alguém exagera nos planos impossíveis.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "introdução",
    "charada": "A parte que ninguém lê com atenção, mas que decide se alguém vai continuar lendo o resto.",
    "charada2": "Também sou a parte que todo mundo pula direto pra ver o resultado final.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "objetividade",
    "charada": "Ir direto ao ponto, coisa que ninguém consegue fazer numa desculpa por chegar atrasado.",
    "charada2": "Também sou o que falta em qualquer resposta de político em entrevista.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "opinião",
    "charada": "Todo mundo tem uma, principalmente sobre assunto que não entende bem.",
    "charada2": "Também sou dada sem ninguém pedir, principalmente sobre futebol e política.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "parágrafo",
    "charada": "Recuo, ideia, ponto final — e ainda assim tem gente que escreve um texto inteiro sem nenhum de mim.",
    "charada2": "Também sou aquele que devia ter três linhas e vira um texto inteiro sozinho.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "proposta",
    "charada": "Aquilo que ninguém pediu pra discutir, mas que virou obrigatório numa folha de prova.",
    "charada2": "Também sou aquela que todo mundo aceita animado e ninguém cumpre depois.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "reflexão",
    "charada": "Aquele momento de pensar profundamente sobre a vida, geralmente às 2 da manhã sem motivo aparente.",
    "charada2": "Também sou aquela que aparece só depois que a decisão errada já foi tomada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "repertório",
    "charada": "Aquelas referências que você guarda pra usar na hora certa, tipo aquela citação que ninguém sabe se é verdadeira mesmo.",
    "charada2": "Também sou usado pra chamar qualquer plano de conversa preparado antes de encontrar alguém importante.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "tema",
    "charada": "Escolhido por alguém que nunca vai ler o que você escreveu sobre mim com tanto carinho quanto você escreveu.",
    "charada2": "Também sou aquele que ninguém escolhe, mas que decide o rumo da festa de aniversário infantil.",
    "charada2_status": "OK"
  },
  {
    "topico": "Redação",
    "palavra": "tese",
    "charada": "A ideia que você defende com unhas e dentes, mesmo sem certeza nenhuma.",
    "charada2": "Também sou aquela ideia repetida tantas vezes que todo mundo já concorda só de cansaço.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "conhecimento",
    "charada": "A única coisa que ninguém consegue tirar de você, exceto na hora da prova que você não estudou.",
    "charada2": "Também sou aquele que todo mundo finge ter numa discussão de bar sobre política.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "consciência",
    "charada": "Aquela voz que fala 'você devia estar estudando' bem na hora do episódio mais interessante da série.",
    "charada2": "Também sou aquela que pesa mais depois da segunda fatia de bolo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "crença",
    "charada": "Aquilo que você aceita sem precisar de prova nenhuma, tipo achar que hoje vai ser o dia que a dieta começa de verdade.",
    "charada2": "Também sou aquela que todo mundo tem sobre qual time vai ser campeão nesse ano.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "dilema",
    "charada": "Uma escolha difícil entre duas opções ruins, tipo decidir entre acordar cedo ou chegar atrasado de novo.",
    "charada2": "Também sou a escolha entre lavar a louça agora ou deixar pra 'daqui a pouco' que nunca chega.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "dúvida",
    "charada": "O motivo de você reler a mesma mensagem cinco vezes antes de enviar.",
    "charada2": "Também sou aquela que aparece bem na hora de apertar o botão de enviar o áudio.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "essência",
    "charada": "O que uma coisa realmente é por trás de toda aparência, tipo aquele perfume que promete durar o dia todo e não dura.",
    "charada2": "Também sou usada pra vender perfume que promete um cheiro que nunca é igual ao da loja.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "ética",
    "charada": "O que impede você de comer o último pedaço de bolo sem perguntar antes.",
    "charada2": "Também sou aquela que some na hora de furar fila achando que ninguém está vendo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "existência",
    "charada": "A pergunta que ataca você bem quando a luz apaga e você já está deitado tentando dormir.",
    "charada2": "Também sou questionada assim que a internet cai no meio de algo importante.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "ideia",
    "charada": "Apareço do nada, geralmente às 2 da manhã, e sumo assim que você acorda pra me anotar.",
    "charada2": "Também sou aquela que parecia genial à noite e péssima na luz do dia seguinte.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "ilusão",
    "charada": "Uma percepção que engana os sentidos, tipo achar que vai estudar cedo só porque comprou uma agenda nova.",
    "charada2": "Também sou aquela de achar que só essa vez o desconto vale realmente a pena.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "liberdade",
    "charada": "A sensação de sexta-feira às 18h em ponto.",
    "charada2": "Também sou a sensação de tirar o sapato apertado assim que chega em casa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "lógica",
    "charada": "A sequência de raciocínio que todo mundo jura seguir, principalmente numa discussão que já perdeu o sentido.",
    "charada2": "Também sou aquela que ninguém segue quando o assunto é comida às 2 da manhã.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "moral",
    "charada": "A régua invisível que todo mundo usa pra julgar o comportamento dos outros, nunca o próprio.",
    "charada2": "Também sou aquela frase no fim da fábula que ninguém lembra até o professor explicar de novo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "pensamento",
    "charada": "Aquilo que passa pela sua cabeça um segundo antes de você falar besteira mesmo assim.",
    "charada2": "Também sou aquele que some completamente na hora exata da prova.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "questionamento",
    "charada": "Aquela pergunta incômoda que ninguém faz até o final da reunião, quando já é tarde demais pra responder direito.",
    "charada2": "Também sou aquele que o grupo de família faz só depois que já é tarde demais pra mudar de ideia.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "razão",
    "charada": "A parte de você que sabe que devia ter ido dormir mais cedo ontem.",
    "charada2": "Também sou aquela que ninguém quer dar em discussão de trânsito.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "realidade",
    "charada": "Aquilo que continua existindo mesmo depois que você fecha os olhos e finge que não viu.",
    "charada2": "Também sou aquela que bate assim que o alarme toca na segunda-feira.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "sentido",
    "charada": "O que você tenta encontrar na vida e também na última temporada de uma série que decidiu não explicar nada.",
    "charada2": "Também sou aquele que ninguém encontra tentando montar móvel sem manual.",
    "charada2_status": "OK"
  },
  {
    "topico": "Filosofia",
    "palavra": "verdade",
    "charada": "Sempre dói mais que a mentira, mesmo sendo mais curta de contar.",
    "charada2": "Também sou aquela que escapa quando alguém pergunta 'quem comeu o último pedaço'.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "cidadania",
    "charada": "Os direitos e deveres que todo mundo lembra dos direitos e esquece os deveres.",
    "charada2": "Também sou lembrada só quando alguém precisa tirar um documento com urgência.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "cidadão",
    "charada": "A pessoa que reclama do imposto e também reclama quando falta asfalto na rua.",
    "charada2": "Também sou usado, formal demais, quando alguém quer soar sério numa reclamação simples.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "classe",
    "charada": "Divido as pessoas por quanto dinheiro elas têm, mesmo quando ninguém quer admitir que reparou nisso.",
    "charada2": "Também sou usada pra chamar qualquer festa chique que serve salgadinho igual às outras.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "comunidade",
    "charada": "O grupo de vizinhos que só se fala de verdade quando falta água ou luz.",
    "charada2": "Também sou usada pra descrever qualquer grupo de fãs discutindo detalhe que só eles entendem.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "costume",
    "charada": "O jeito de fazer as coisas que vira automático, tipo pôr sal antes mesmo de provar a comida.",
    "charada2": "Também sou aquele jeito de fazer as coisas que ninguém sabe mais explicar como começou.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "cultura",
    "charada": "O motivo de cada família ter uma regra completamente diferente pra passar o Natal.",
    "charada2": "Também sou usada pra justificar qualquer comida estranha que a família insiste em servir no Natal.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "desigualdade",
    "charada": "A razão de duas pessoas nascerem no mesmo país e terem chances completamente diferentes.",
    "charada2": "Também sou usada pra descrever quem sempre pega o pedaço menor do bolo sem perceber.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "direito",
    "charada": "Aquilo que você invoca bem alto assim que alguém tenta te prejudicar.",
    "charada2": "Também sou invocado bem alto na fila do banco assim que alguém tenta furar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "diversidade",
    "charada": "Ter gente diferente reunida no mesmo lugar, tipo o grupo de família que ninguém entende como ainda funciona.",
    "charada2": "Também sou usada pra descrever qualquer grupo de amigos que discorda até de qual filme assistir.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "estereótipo",
    "charada": "A ideia pronta que todo mundo tem sobre um grupo antes mesmo de conhecer alguém dele de verdade.",
    "charada2": "Também sou usado, sem pensar, pra julgar time de futebol adversário antes do jogo começar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "família",
    "charada": "O grupo que você não escolhe, mas que aparece inteiro assim que alguém posta uma foto de herança.",
    "charada2": "Também sou usada pra descrever qualquer grupo de zap que ninguém tem coragem de silenciar de vez.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "grupo",
    "charada": "Aquele do WhatsApp que ninguém tem coragem de sair, só de silenciar.",
    "charada2": "Também sou usado pra chamar qualquer trabalho escolar em que uma pessoa faz tudo sozinha.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "identidade",
    "charada": "A resposta que ninguém consegue dar rápido quando alguém pergunta 'me conta sobre você'.",
    "charada2": "Também sou aquela que ninguém lembra de levar exatamente no dia que mais precisa dela.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "instituição",
    "charada": "Uma organização com regras próprias, tipo a família que tem lei não escrita sobre quem senta onde na mesa de Natal.",
    "charada2": "Também sou usada pra chamar qualquer empresa que muda de regra toda semana sem avisar ninguém.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "norma",
    "charada": "A regra que todo mundo segue sem nunca ter assinado nada, tipo separar o lixo só quando alguém está olhando.",
    "charada2": "Também sou aquela que todo mundo ignora até o fiscal aparecer.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "poder",
    "charada": "Quem segura o controle remoto de verdade na casa.",
    "charada2": "Também sou disputado sempre que sobra o último pedaço de qualquer coisa boa na mesa.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "preconceito",
    "charada": "Julgar o livro pela capa antes mesmo de ler o título.",
    "charada2": "Também sou aquele que aparece escondido atrás de um elogio mal disfarçado.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "religião",
    "charada": "O conjunto de crenças que sempre vira assunto proibido na mesa de almoço de domingo, e mesmo assim sempre aparece.",
    "charada2": "Também sou usada, errado, pra descrever qualquer time de futebol que alguém defende cegamente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "sociedade",
    "charada": "Todo mundo, inclusive quem jura que 'não liga pra opinião dos outros'.",
    "charada2": "Também sou culpada por qualquer decisão ruim que alguém não quer assumir sozinho.",
    "charada2_status": "OK"
  },
  {
    "topico": "Sociologia",
    "palavra": "tradição",
    "charada": "Aquilo que a família repete todo ano só porque sempre foi assim, mesmo sem ninguém lembrar por quê.",
    "charada2": "Também sou aquela receita de família que só sai boa na mão de uma pessoa específica.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "alfabeto",
    "charada": "Vinte e seis letrinhas que decidem toda discussão sobre como se escreve certo.",
    "charada2": "Também sou o motivo de qualquer lista de compras nunca seguir a ordem certa das letras.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "bilíngue",
    "charada": "Quem fala dois idiomas, e ainda assim trava igual todo mundo na hora de pedir a conta no restaurante.",
    "charada2": "Também sou o rótulo de embalagem que ninguém lê no verso porque já entendeu na frente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "conversa",
    "charada": "Sempre fico mais interessante depois que alguém já foi embora e não pode mais participar de mim.",
    "charada2": "Também sou aquela que todo mundo jura que vai ter 'rapidinho' e dura a noite inteira.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "diálogo",
    "charada": "A parte do livro que você lê rápido só pra saber quem falou o quê.",
    "charada2": "Também sou aquele que dois grupos de WhatsApp têm ao mesmo tempo sem nenhum se falar de verdade.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "expressão",
    "charada": "Um jeito de dizer algo que não faz sentido nenhum traduzido ao pé da letra pra outro idioma.",
    "charada2": "Também sou aquela cara que todo mundo faz quando prova algo picante achando que ia ser suave.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "fala",
    "charada": "A coisa que trava completamente na primeira vez que você precisa usar outro idioma de verdade.",
    "charada2": "Também sou aquela que todo mundo perde só de ver a conta do restaurante dividida errado.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "gíria",
    "charada": "A palavra que os mais velhos usam errado tentando parecer descolados.",
    "charada2": "Também sou usada errada por qualquer adulto tentando parecer jovem no grupo de família.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "idioma",
    "charada": "Aquele que você jura entender assistindo série com legenda, e trava completamente numa ligação de verdade.",
    "charada2": "Também sou usado, mal, quando alguém tenta impressionar usando só três palavras decoradas.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "intérprete",
    "charada": "Traduzo na hora, sem tempo pra pensar, tipo você tentando explicar uma piada que ninguém mais riu.",
    "charada2": "Também sou o papel de quem sempre precisa explicar a piada que ninguém entendeu na roda.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "legenda",
    "charada": "A única razão de você entender o final do filme sem precisar admitir que não sabe o idioma.",
    "charada2": "Também sou aquela que aparece atrasada bem na cena mais importante do filme.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "língua",
    "charada": "Também sou a parte da boca que enrola bonito na hora de pronunciar uma palavra difícil.",
    "charada2": "Também sou o motivo de qualquer sotaque forte virar imitação exagerada de amigo brincalhão.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "pronúncia",
    "charada": "O motivo de você preferir mandar áudio a falar aquela palavra difícil em inglês.",
    "charada2": "Também sou aquela que trava justo na palavra mais fácil da frase inteira.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "significado",
    "charada": "O que uma palavra realmente quer dizer, coisa que o tradutor automático sempre erra na hora mais importante.",
    "charada2": "Também sou aquele que se perde completamente quando a piada é traduzida ao pé da letra.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "sotaque",
    "charada": "A prova de onde você nasceu, mesmo depois de anos tentando me esconder.",
    "charada2": "Também sou copiado errado por qualquer um tentando imitar região que não é a sua.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "tradução",
    "charada": "Transformo uma piada engraçada em outro idioma numa frase sem graça nenhuma.",
    "charada2": "Também sou aquela que o aplicativo faz ao pé da letra e vira frase sem nexo nenhum.",
    "charada2_status": "OK"
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "vocabulário",
    "charada": "Cresço muito rápido quando o assunto é xingamento em outro idioma.",
    "charada2": "Também sou aquele que aumenta bem rápido quando o assunto é resposta de discussão online.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "artista",
    "charada": "Quem transforma sentimento em obra, e também qualquer pessoa que decora o próprio bolo de aniversário torto com orgulho.",
    "charada2": "Também sou o apelido de quem enrola qualquer desculpa de um jeito bonito demais pra ser verdade.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "ator",
    "charada": "Finge sentir emoção profissionalmente, coisa que todo mundo já fez pelo menos uma vez numa festa chata.",
    "charada2": "Também sou o papel de quem finge gostar do presente feio no aniversário.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "cena",
    "charada": "Um pedacinho da história que, fora de contexto, sempre parece mais dramático do que realmente é.",
    "charada2": "Também sou aquela que todo mundo faz quando o pedido do restaurante demora além da conta.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "cor",
    "charada": "O motivo de duas pessoas discutirem se aquele vestido é azul ou dourado.",
    "charada2": "Também sou escolhida errado bem na hora de pintar a parede e só descobrem depois de seca.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "dança",
    "charada": "A primeira coisa que todo mundo jura que não sabe fazer, um segundo antes de fazer mesmo assim no casamento.",
    "charada2": "Também sou aquela que ninguém sabe o nome, mas todo mundo reconhece na hora que toca.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "desenho",
    "charada": "Sempre pareço mais fácil no vídeo do YouTube do que na sua própria mão.",
    "charada2": "Também sou aquele rabisco que a criança jura que é um cachorro e todo mundo finge reconhecer.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "escultura",
    "charada": "Uma pedra que alguém teve paciência suficiente pra me transformar em outra coisa.",
    "charada2": "Também sou o resultado de horas de praia tentando fazer um castelo de areia decente.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "instrumento",
    "charada": "Todo mundo me comprou pra aprender em 2020, e estou pegando poeira desde então.",
    "charada2": "Também sou usado, sem afinar, pela criançada logo cedo num domingo de sossego.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "melodia",
    "charada": "A parte da música que gruda na cabeça o dia inteiro mesmo você não lembrando a letra.",
    "charada2": "Também sou aquela que toca na loja e vira trilha sonora da sua semana inteira sem querer.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "museu",
    "charada": "O lugar mais silencioso que existe, até alguém esquecer de colocar o celular no silencioso.",
    "charada2": "Também sou o nome carinhoso que dão pra qualquer quarto cheio de coisa velha guardada.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "música",
    "charada": "Grudo na sua cabeça o dia inteiro depois de tocar só uma vez de manhã.",
    "charada2": "Também sou aquela que o vizinho escolhe pra malhar às 6h de um domingo.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "obra",
    "charada": "Posso ser um quadro num museu, ou aquela reforma na rua que nunca termina.",
    "charada2": "Também sou o nome de qualquer conserto de casa que promete uma semana e vira três meses.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "palco",
    "charada": "O lugar onde qualquer nervosismo vira parte do show, quer você queira ou não.",
    "charada2": "Também sou o centro das atenções de qualquer festa de aniversário de criança pequena.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "pincel",
    "charada": "A ferramenta que promete uma pintura perfeita, e sempre termina com mais tinta na sua roupa do que na tela.",
    "charada2": "Também sou trocado por qualquer coisa na mão de criança fazendo arte pela primeira vez.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "pintura",
    "charada": "Posso valer uma fortuna ou parecer rabisco de criança, dependendo de quem assinou embaixo.",
    "charada2": "Também sou aquela que descasca da parede bem no canto que ninguém repara até visita chegar.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "retrato",
    "charada": "A versão sua que sai bem melhor no papel do que na selfie de verdade.",
    "charada2": "Também sou aquele quadro na sala que ninguém sabe dizer de quando é a foto.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "ritmo",
    "charada": "O que falta pra metade da pista de dança no casamento logo depois da primeira música mais animada.",
    "charada2": "Também sou perdido completamente na primeira aula de dança que alguém resolve tentar depois dos 30.",
    "charada2_status": "OK"
  },
  {
    "topico": "Artes",
    "palavra": "teatro",
    "charada": "Onde fingir sentimento na frente de estranhos é literalmente o trabalho.",
    "charada2": "Também sou usado pra chamar qualquer discussão exagerada de novela mexicana em pleno almoço de família.",
    "charada2_status": "OK"
  }
]
```


---

**Nota de contexto (não faz parte do prompt para o Gemini):** ao gerar este arquivo, conferi o banco atual e encontrei **0 palavra(s)** sem "charada2" preenchida. Ou seja, hoje praticamente todo o banco já tem a segunda charada — o prompt acima já lida com isso automaticamente via o campo `charada2_status`, então funciona também se você rodar de novo no futuro com um banco diferente.
