import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonBadge
} from '@ionic/angular/standalone';


/* =========================================================
   INTERFACES
========================================================= */

interface ObjetoCasa {
  id: string;
  nome: string;
  divisao: string;
  categoria: string;

  gosta: string;
  fazFeliz: string;
  utiliza: string;
  precisa: string;

  padraoApego: string;
  reflexao: string;

  emocao: string;
  motivoManter: string;

  destino: string;
  data: string;
}

interface ReflexaoCasa {
  id: string;
  divisao: string;
  carta: string;
  resposta: string;
  data: string;
}

interface DesafioCasa {
  titulo: string;
  descricao: string;
  reflexao: string;
}

interface TemaEducativo {
  id: number;
  titulo: string;
  imagem?: string;
  conteudo: string;
}


/* =========================================================
   COMPONENTE
========================================================= */

@Component({
  selector: 'app-a-tua-casa',
  templateUrl: './a-tua-casa.page.html',
  styleUrls: ['./a-tua-casa.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonRadioGroup,
    IonRadio,
    IonBadge
  ]
})
export class ATuaCasaPage implements OnInit {


  /* =======================================================
     CHAVES DE ARMAZENAMENTO
  ======================================================= */

  private readonly KEY_OBJETOS = 'a_tua_casa_objetos_v1';

  private readonly KEY_REFLEXOES = 'a_tua_casa_reflexoes_v1';

  private readonly KEY_DESAFIOS = 'a_tua_casa_desafios_v1';


  /* =======================================================
     DIVISÕES DA CASA
  ======================================================= */

  divisoes: string[] = [
    'Entrada',
    'Hall',
    'Sala de estar',
    'Sala de jantar',
    'Cozinha',
    'Despensa',
    'Quarto',
    'Quarto de hóspedes',
    'Casa de banho',
    'Escritório',
    'Garagem',
    'Varanda',
    'Jardim',
    'Arrecadação',
    'Cave',
    'Sótão',
    'Outra divisão'
  ];


  /* =======================================================
     FORMULÁRIO DE AVALIAÇÃO
  ======================================================= */

  nomeObjeto = '';
  novaDivisao = '';
  categoriaObjeto = '';

  gosta = '';
  fazFeliz = '';
  utiliza = '';
  precisa = '';

  padraoApegoObjeto = '';
  reflexaoObjeto = '';

  emocaoObjeto = '';
  motivoManter = '';

  destinoObjeto = 'manter';


  /* =======================================================
     OBJETOS GUARDADOS
  ======================================================= */

  objetos: ObjetoCasa[] = [];

  objetoEmEdicao: ObjetoCasa = this.criarObjetoVazio();


  /* =======================================================
     CONVERSAS COM A CASA
  ======================================================= */

  divisaoReflexao = '';
  cartaDaCasa = '';
  respostaCasa = '';

  reflexoesCasa: ReflexaoCasa[] = [];

  reflexaoCasaEmEdicao: ReflexaoCasa = this.criarReflexaoVazia();


  /* =======================================================
     DESAFIOS
  ======================================================= */

  desafios: DesafioCasa[] = [

    {
      titulo: 'Escolhe um pequeno espaço',
      descricao: 'Escolhe uma gaveta, uma prateleira ou uma pequena superfície e observa o que lá guardas.',
      reflexao: 'Tudo o que está neste espaço continua a ter uma função na tua vida?'
    },

    {
      titulo: 'Observa aquilo que evitas',
      descricao: 'Identifica um objeto ou conjunto de objetos que tens adiado organizar.',
      reflexao: 'O que te leva a adiar esta tarefa? É falta de tempo, energia ou existe alguma emoção associada?'
    },

    {
      titulo: 'Reconhece o que já cumpriu a sua função',
      descricao: 'Procura um objeto que já tenha sido útil, mas que atualmente não utilizas.',
      reflexao: 'Consegues reconhecer a sua importância passada sem precisares de o conservar?'
    },

    {
      titulo: 'Liberta uma decisão adiada',
      descricao: 'Escolhe um objeto sobre o qual já pensaste várias vezes, mas nunca decidiste o que fazer.',
      reflexao: 'O que precisas de saber ou sentir para tomar uma decisão?'
    },

    {
      titulo: 'Olha para os objetos oferecidos',
      descricao: 'Observa os objetos que conservas por terem sido oferecidos por outras pessoas.',
      reflexao: 'É possível agradecer o gesto e continuar a tua vida sem guardar todos os presentes?'
    },

    {
      titulo: 'Cria espaço para o presente',
      descricao: 'Escolhe algo que já não representa a tua vida atual.',
      reflexao: 'O que estás a tentar conservar: o objeto, uma recordação ou uma versão antiga de ti?'
    },

    {
      titulo: 'Observa os projetos adiados',
      descricao: 'Procura materiais que guardas para projetos que ainda não realizaste.',
      reflexao: 'Continuas verdadeiramente interessado nesses projetos ou estás a conservar possibilidades?'
    },

    {
      titulo: 'Cuida de uma divisão',
      descricao: 'Escolhe uma divisão e identifica uma pequena mudança que a torne mais agradável.',
      reflexao: 'Como gostarias de te sentir quando entras nesta divisão?'
    },

    {
      titulo: 'Pratica a gratidão e o desapego',
      descricao: 'Escolhe um objeto de que te vais desfazer e reconhece aquilo que representou.',
      reflexao: 'Consegues agradecer a sua contribuição sem sentires que precisas de o conservar?'
    },

    {
      titulo: 'Observa a relação entre espaço e vida',
      descricao: 'Percorre a casa e observa os espaços que estão ocupados por coisas que já não utilizas.',
      reflexao: 'Que novas possibilidades poderiam surgir se tivesses mais espaço disponível?'
    }

  ];

  desafioAtual: DesafioCasa = this.desafios[0];

  desafioConcluidoHoje = false;


  /* =======================================================
     TEMAS EDUCATIVOS

     As imagens são definidas apenas no campo "imagem".
     Os conteúdos não repetem as mesmas imagens em HTML.
  ======================================================= */

  temasEducativos: TemaEducativo[] = [

    {
      id: 1,
      titulo: 'Diferentes pisos',
      imagem: 'assets/fotos_sombra/pisos.webp',
      conteudo: `
        <p>
          Os pisos representam os vários níveis que encontramos no interior da alma.
          As caves, por sua vez, representam os instintos, ou então o inconsciente
          e o passado. O rés-do-chão representa o presente, a consciência inerente
          ao estado de vigília. Quanto mais subimos, mais nos aproximamos do ser,
          da dimensão espiritual e do futuro.
        </p>

        <p>
          Habitas uma cave presentemente? Passas muito tempo na cave da tua casa?
          Evidentemente que o significado dessas circunstâncias varia de pessoa
          para pessoa. Talvez sintas necessidade de perseguir os teus prazeres
          e as tuas necessidades materiais. Se for o caso, isso poderá resultar
          do facto de não teres honrado essas necessidades anteriormente. Talvez
          nunca te tenhas permitido explorar os teus instintos. Apenas tu poderás
          decidir se o facto de te focares na satisfação dos teus instintos básicos
          — neste caso, os instintos de satisfação dos sentidos — te traz mais
          vantagens do que inconvenientes. Convém não esquecer que para exercermos
          o domínio sobre os instintos devemos começar por aprender a vivenciá-los.
          A atração que sentes pelo subsolo também pode significar que neste momento
          tens necessidade de explorar o teu subconsciente para descobrires outras
          facetas da tua personalidade, que vives excessivamente no passado ou que
          o teu passado exerce uma forte influência na tua vida presente.
        </p>

        <p>
          Se, pelo contrário, habitas a zona mais alta de um edifício, isso pode
          significar que te sentes interiormente atraída pela espiritualidade
          e pelo ser. Neste caso, não nutres um interesse exclusivo pela dimensão
          material da vida. Honras essa tua tendência ou resistes-lhe? Se vives
          num lugar bastante elevado da natureza, então estarás ainda mais em
          contacto com a dimensão espiritual do teu ser. É muito mais fácil
          estabelecer um contacto consciente com Deus quando nos encontramos
          em comunhão com as belezas da natureza do que quando estamos enredados
          na confusão de uma cidade poluída!
        </p>
      `
    },

    {
      id: 2,
      titulo: 'Tetos e escadas',
      imagem: 'assets/fotos_sombra/escadas.webp',
      conteudo: `
        <p>
          Como são os tetos da tua casa? Baixos? Altos? Quanto mais altos forem,
          mais espaço e liberdade terás para chegares mais longe na tua vida.
          Há muitas escadas na tua casa? Como sabes, utilizamos as escadas para
          subir ou para descer. As escadas da tua casa simbolizam a passagem
          do subconsciente para o consciente e do consciente para o subconsciente.
          Se sobes e desces constantemente as escadas da tua casa, isso significa
          que, na tua vida presente, oscilas continuamente entre diversos estados
          de consciência. Mas se permaneces sempre num dos pisos, é possível que
          estejas a atravessar um período predominantemente estável da tua vida.
        </p>
      `
    },

    {
      id: 3,
      titulo: 'Casa espaçosa ou apertada',
      conteudo: `
        <p>
          A tua casa é espaçosa? Se sim, isso traduz a necessidade de respirares
          à vontade no teu mundo interior e significa que te concedes espaço
          para tal. Se, pelo contrário, tudo é pequeno e te sentes apertada,
          isso significa que não te concedes o espaço suficiente para cresceres
          e respirares livremente.
        </p>
      `
    },

    {
      id: 4,
      titulo: 'Objetos acumulados',
      imagem: 'assets/fotos_sombra/tralha.webp',
      conteudo: `
        <p>
          A tua casa está atafulhada de peças de mobiliário, bibelôs e lembranças
          que acumulaste ao longo dos anos? Se for o caso, é altamente provável
          que o mesmo esteja a acontecer dentro de ti. Tens dificuldade em
          desapegar-te dos teus princípios, dos teus hábitos, das tuas velhas
          ideias? Talvez desejes ter coisas novas, embora não reconheças
          a necessidade de te desfazeres das tuas velharias para abrires espaço
          ao novo!
        </p>

        <p><strong>Viver rodeado de tralha pode ter consequências como:</strong></p>

        <ul>
          <li>Fazer-nos sentir cansados e letárgicos, sem energia sequer para começar a destralhar.</li>
          <li>Manter-nos presos ao passado.</li>
          <li>Alterar a nossa vida social, pois ficamos tão envergonhados por ter a casa tão desarrumada e suja que evitamos receber os amigos.</li>
          <li>Afetar o peso. Uma pessoa obesa que ponha a casa «em dieta», e comece a deitar fora o lixo, não se sente bem a comer comida pouco saudável.</li>
          <li>Causar um estado de confusão. Destralhar ajuda-nos a focar nos objetivos que queremos para a nossa vida.</li>
          <li>Contribuir para a procrastinação.</li>
          <li>Causar desarmonia, discussões e zangas tanto em casa como no trabalho.</li>
          <li>Causar depressão. A energia estagnada puxa-nos para baixo e faz-nos sentir sem esperança.</li>
          <li>Contribuir para pôr a vida em «pausa».</li>
        </ul>

        <p>
          Um conselho: a vida é uma bênção, não deixes que a vida te escape.
        </p>

        <p><strong>Em que consiste a tralha?</strong></p>

        <ul>
          <li>Coisas que já não utilizamos nem gostamos.</li>
          <li>Tudo o que estiver inacabado, no plano físico, mas também mental, emocional e espiritual.</li>
          <li>Coisas desarrumadas e desorganizadas.</li>
          <li>Cabeça cheia de tarefas que ainda não realizou.</li>
          <li>Demasiadas coisas num espaço demasiado pequeno.</li>
        </ul>

        <p><strong>Tralha comum</strong></p>

        <p>
          São os objetos e coisas que nunca utilizaste, de que não gostas e que
          ocupam espaço no teu roupeiro ou casa. Também temos a confusão, a pilha,
          o monte de papéis, a desordem e, por fim, o caos. Fazem parte deste tipo
          também o correio por ler, papeladas, objetos partidos ou jornais e
          revistas velhas.
        </p>

        <p>
          A tralha pode estar sobre as mesas, em cantos, no chão, atrás das portas,
          em garagens, arrecadações ou sótãos.
        </p>

        <p><strong>Tralha simbólica</strong></p>

        <p>
          São os objetos que afetam inconscientemente de forma negativa. Fazem
          parte desta tralha presentes de que nunca gostaste ou objetos que
          suscitam memórias infelizes que ainda estão em tua casa.
        </p>

        <p><strong>Tralha energética</strong></p>

        <p>
          São os objetos que te sugam a energia e que te desgastam. São fotografias
          de pessoas que passaram pela tua vida e deixaram uma marca menos positiva;
          presentes de uma relação passada; peças de mobiliário que herdaste e das
          quais não gostas; ou peças compradas em velharias e cuja história não
          conheces.
        </p>

        <p><strong>Tralha mental e emocional</strong></p>

        <p>
          São questões emocionais não resolvidas, tarefas por fazer, relações
          drenantes. São a sensação de estar preso ao passado ou de correr em várias
          direções, com diversos estímulos à tua volta e perder o foco e a organização.
        </p>

        <p><strong>Tralha digital</strong></p>

        <p>
          O ideal é limpar e-mails semanalmente. Também devemos apagar o contacto
          de pessoas indesejáveis, ou que foram incorretas connosco. Limpar pessoas
          que nos vampirizam e esgotam (pessoas negativas). Quando digo para limpar,
          é mesmo para apagar o contacto do telemóvel, o e-mail e bloquear no
          Facebook. Quando limpamos... aparecem novas pessoas.
        </p>

        <p>
          Para cada objeto, podes utilizar as quatro perguntas essenciais
          apresentadas na primeira secção desta página. Elas ajudam a distinguir
          o gosto, a utilidade, a necessidade e o significado emocional que atribuis
          ao que conservas.
        </p>

        <p><strong>Razões falsas para acumular tralha:</strong></p>

        <ul>
          <li>Esta coisa é tão útil que, um dia, hei de arranjar maneira de lhe dar uso.</li>
          <li>Podia mandar arranjar ou alterar isto.</li>
          <li>A vida é demasiadamente curta para perder o meu tempo a lidar com isto agora.</li>
          <li>Esta coisa foi-me oferecida, por isso tenho de a guardar, por uma questão de respeito por quem ma deu.</li>
          <li>Isto ainda não foi tudo usado.</li>
          <li>É só uma questão de esperar, isto algum dia se há de transformar num item colecionável!</li>
          <li>Nunca tive uma coisa destas quando era criança, por isso quero tê-la agora que sou adulto.</li>
          <li>Quanto mais coisas eu guardar, mais terei para deixar um dia à minha família.</li>
          <li>Isto faz-me lembrar uma pessoa que adoro.</li>
          <li>Se eu tratar disto agora — se eu fizer a cama ou lavar este prato — irei ter de tratar disto tudo outra vez amanhã.</li>
          <li>Sou mais criativo com tudo isto à minha volta.</li>
          <li>Não consigo tratar disto enquanto as pessoas à minha volta não concordarem no destino que lhe havemos de dar.</li>
          <li>Um dia, poderei vir a precisar disto.</li>
          <li>Não tenho espaço para guardar esta coisa como deve ser.</li>
          <li>Quando tiver tempo, irei fazer um projeto mesmo giro com esta coisa.</li>
          <li>Remexer nas minhas coisas desencadeia emoções com as quais não consigo lidar neste momento.</li>
          <li>Toda a gente que conheço tem esta coisa, por isso, eu também devia ter uma.</li>
          <li>Não tenho tempo nem energia agora para decidir o que fazer com isto.</li>
          <li>Se me livrar desta coisa e de outras coisas, a minha casa ou o meu escritório irá parecer estéril ou vazio.</li>
          <li>Tive esta coisa tanto tempo que não me consigo livrar dela agora.</li>
          <li>Tinha-me esquecido disto! Já nem sabia que ali estava.</li>
          <li>Esta coisa vai sentir-se sozinha ou abandonada se me livrar dela.</li>
          <li>Tenho a certeza de que vou usar isto assim que der uma grande volta à minha vida. Vou arranjar um cãozinho. Vou perder 15 quilos. Vou formar uma banda.</li>
          <li>Não sei onde hei de pôr esta coisa, por isso vou pousá-la... aqui.</li>
          <li>Tenho de deixar esta coisa num sítio onde a consiga ver para me lembrar que tenho de tratar dela.</li>
        </ul>
      `
    },

    {
      id: 5,
      titulo: 'Pó e poeira',
      imagem: 'assets/fotos_sombra/po.webp',
      conteudo: `
        <p>
          O asseio é um fator importante na tua casa? Se movimentássemos os móveis,
          encontraríamos poeira acumulada? Os teus armários e gavetas estão limpos?
          Se deixaste acumular pó, isso significa que provavelmente o mesmo aconteceu
          ao nível do teu espírito. Essa poeira tem origem na dimensão mental, num
          intelecto que procura entender, racionalizar e analisar tudo. Na verdade,
          esse é o melhor caminho para o orgulho! Uma pessoa orgulhosa quer sempre
          ter razão e tenta impor as suas ideias; essa atitude gera poeira e grandes
          indisposições interiores, assim como ao nível das interações com os outros.
        </p>
      `
    },

    {
      id: 6,
      titulo: 'Desarrumação',
      imagem: 'assets/fotos_sombra/desarrumado.webp',
      conteudo: `
        <p>
          Os corredores, foyers, escadas e entradas são as artérias e veias que
          percorrem a tua casa: transportam a força vital para todas as diferentes
          áreas através do teu espaço. Quando estas avenidas cruciais são bloqueadas
          com desordem, é análogo a ter quantidades elevadas de colesterol no teu
          sangue, e é igualmente perigoso para a tua saúde. Bloqueia a força vital
          «artérias» na tua casa da mesma forma exata, resultando em doenças tais
          como tensão arterial elevada, doença cardíaca, angina, AVC, tumores,
          doenças do sangue, distúrbios metabólicos e órgãos que se tornam preguiçosos
          e eventualmente doentes.
        </p>

        <p>
          A desorganização tem muitas características, dependendo de onde se acumula
          na tua casa. As dinâmicas energéticas da desordem são muitas vezes
          relacionadas com questões que se escondem e com as quais não se querem
          lidar, ou para as quais existe alguma vergonha subjacente. A desordem cria
          obstáculos à criatividade nas nossas vidas. Ajuda a atrasar-nos, sabota
          os nossos sonhos e interfere no funcionamento da «ordem divina». Nós,
          humanos, adoramos usar a desordem para evitar lidar com a nossa vida
          e os nossos sentimentos.
        </p>
      `
    },

    {
      id: 7,
      titulo: 'Sistema elétrico',
      imagem: 'assets/fotos_sombra/eletricidade.webp',
      conteudo: `
        <p>
          Toda a eletricidade que funciona através da tua casa ressoa no sistema
          elétrico do teu próprio corpo, o teu sistema nervoso. Quando o sistema
          elétrico da tua casa está em desespero, afeta negativamente o teu nível
          de energia e a tua capacidade para permanecer direto, concentrado, claro
          e calmo. Cria padrões energéticos na casa que rapidamente desaparecem
          ou ficam bloqueados, os quais, por sua vez, causam burnout e mal-estar
          a todos os indivíduos que vivem nesse espaço. Cria tensão e amplifica
          o «rastilho curto» de qualquer pessoa que tem um temperamento curto ou
          está predisposta ao stress, à impaciência e a discutir. De uma perspetiva
          energética, quando a eletricidade não está a funcionar corretamente em
          casa, contribui para muita luta sobre coisas inconsequentes.
        </p>

        <p>
          Qualquer doença que tenha a ver com o sistema nervoso, incluindo depressão,
          perturbações relacionadas com a ansiedade, crises nervosas ou emocionais,
          desequilíbrios hormonais, problemas da tiroide e a difícil menopausa,
          será exacerbada por um sistema elétrico fraco ou defeituoso.
        </p>
      `
    },

    {
      id: 8,
      titulo: 'Fugas e infiltrações',
      imagem: 'assets/fotos_sombra/fugas.webp',
      conteudo: `
        <p>
          Vazamentos de qualquer tipo podem criar uma série de problemas de saúde,
          porque o nosso corpo é constituído na sua maioria por água. Quando os
          problemas na nossa casa são relacionados com a água, temos uma inclinação
          natural, fisicamente, para ressoar a esse problema. Os nossos corpos
          respondem à drenagem de energia, o que, com o tempo, pode levar a fadiga
          e doenças «runny», tais como problemas sinusais, diarreia e infeções
          do trato urinário. Além disso, a água no Feng Shui ressoa com a mesma
          vibração que o dinheiro e as nossas emoções. Assim, para compor uma
          situação já deletéria, as fugas podem também causar depressão e explosões
          emocionais. Podem também criar instabilidade financeira, especialmente
          se se mantiverem sem controlo. Estes problemas, por sua vez, podem causar
          muitos problemas relacionados com o stress.
        </p>
      `
    },

    {
      id: 9,
      titulo: 'Portas',
      conteudo: `
        <p>
          Quando deixas acumular objetos de qualquer modo atrás das portas,
          isto é um sinal evidente de que tens medo de não ser aceite e de que
          te sentes vigiado.
        </p>

        <p>
          Cada porta de entrada é um lugar sagrado de transição que traz suporte
          de vida sob a forma de ch'i e oxigénio. Portas que não se abrem até ao
          fim, fecham indevidamente, ficam encravadas ou têm dobradiças que estão
          quebradas ou rangem criam padrões energéticos que afetam negativamente
          a saúde. As portas e as suas dobradiças servem a mesma finalidade em
          casa que as articulações fazem no corpo, na medida em que permitem
          movimentos flexíveis. Problemas de articulação relacionados com os
          cotovelos, pulsos, pescoço, ancas, joelhos e tornozelos são consequências
          comuns de portas que permanecem em ruínas. As portas problemáticas podem
          exacerbar todas as doenças articulares tais como artrite, reumatismo,
          esclerose múltipla, TMJ e dores no pescoço e ombro. As portas também
          supervisionam a nossa área da cabeça em Feng Shui. Para quaisquer
          problemas de cabeça relacionados, tais como tumores, derrames ou
          enxaquecas, verificar todas as portas e vias de entrada para obstruções
          e desordem.
        </p>

        <p>
          Além disso, as portas supervisionam as «bocas dos adultos». Portas
          problemáticas desalojam os adultos e criam «lutas de poder» com crianças
          adolescentes, transferindo a autoridade dos pais para a criança com
          excesso de poder. As portas também representam a «voz» do adulto.
          Quando um quarto significativo, como um quarto principal, tem uma
          porta de entrada mas sem porta física, é como ter uma boca sem uma
          língua e um adulto sem voz ativa! Portas que não alinham, ou não
          enfrentam uma à outra e são de tamanhos diferentes, podem também criar
          problemas entre adultos, tal como uma discussão constante ou uma
          incapacidade de afirmar a si próprio. A nível físico, as portas também
          supervisionam a saúde dos dentes, gengivas e boca. Embora não seja raro
          ter pelo menos uma porta problemática em casa, o que se encontra ainda
          mais frequentemente são fechaduras partidas e fechos, que afetam a nossa
          segurança emocional, e maçanetas de porta vacilantes, que afetam a nossa
          capacidade de «conseguir uma pega nas coisas».
        </p>
      `
    },

    {
      id: 10,
      titulo: 'Cozinha',
      conteudo: `
        <p>
          O ressentimento e a fragilidade emocional são as mensagens transmitidas
          por uma cozinha negligenciada e em que a arrumação prima pela ausência.
        </p>

        <p>
          A cozinha representa o domínio que é regido pelo feminino. Como referi
          anteriormente, a propósito do princípio feminino, trata-se do aspeto
          nutritivo e criativo do ser humano, independentemente de nos referirmos
          a homens ou a mulheres. O princípio feminino consiste no dom de exprimir
          ternura e doçura, na abertura à intuição e à dimensão psíquica do ser.
          Por conseguinte, o princípio feminino é aquele que está mais em contacto
          com as verdadeiras necessidades do ser. A tua cozinha está em ordem?
          É uma cozinha espaçosa, funcional e agradável? A tua cozinha revela
          claramente o que se passa dentro de ti e em que medida estás conectado
          com o teu princípio feminino.
        </p>
      `
    },

    {
      id: 11,
      titulo: 'Quarto',
      conteudo: `
        <p>
          Se o local onde dormes é um caos, isto indica que há assuntos pendentes
          na tua vida, muitas coisas por terminar, e que te é difícil ter um
          trabalho ou uma relação estável.
        </p>

        <p>
          É a divisão mais confortável da tua casa? Sentes-te bem no teu quarto?
          O teu quarto é do teu agrado? O teu quarto representa o aspeto íntimo
          do teu ser. Se desejas conhecer o teu lado íntimo, descreve o teu quarto
          a alguém que nunca o tenha visto e presta a devida atenção às palavras
          que usas na tua descrição: são elas que te revelarão o clima da tua
          vida íntima.
        </p>
      `
    },

    {
      id: 12,
      titulo: 'Hall',
      conteudo: `
        <p>
          A falta de ordem e a acumulação de objetos na entrada da casa são
          indicadores claros de pessoas com medo de socializar, de pessoas que
          evitam relacionar-se com outras.
        </p>
      `
    },

    {
      id: 13,
      titulo: 'Sala de estar',
      conteudo: `
        <p>
          Outro indicador de fobia social é a desarrumação da sala de estar.
          Uma sala onde os objetos se acumulam sem qualquer ordem traduz o medo
          de a pessoa ser rejeitada socialmente.
        </p>
      `
    },

    {
      id: 14,
      titulo: 'Sala de jantar',
      conteudo: `
        <p>
          Uma sala de jantar desarrumada indicia medo de não dar passos firmes
          e sólidos, tal como a sensação de ser dominado pela família.
        </p>
      `
    },

    {
      id: 15,
      titulo: 'Armários',
      conteudo: `
        <p>
          Roupa, sapatos e carteiras amontoados de qualquer maneira no interior
          dos armários são prova de falta de controlo emocional.
        </p>
      `
    },

    {
      id: 16,
      titulo: 'Corredores',
      conteudo: `
        <p>
          Se os objetos se acumulam sem ordem nos corredores de casa, isto
          significa dificuldades em comunicar com os outros, medo de dizer
          o que se pensa.
        </p>
      `
    },

    {
      id: 17,
      titulo: 'Escritório',
      conteudo: `
        <p>
          A desarrumação do escritório, ou do lugar onde se trabalha, indica
          medo, frustração e necessidade de controlar as situações.
        </p>
      `
    },

    {
      id: 18,
      titulo: 'Garagem',
      conteudo: `
        <p>
          Se o lugar onde estacionas o carro está desarrumado, é sinal de que
          provavelmente sentes medo e de que tens pouca capacidade para te
          manter atualizado.
        </p>
      `
    },

    {
      id: 19,
      titulo: 'Despensa',
      conteudo: `
        <p>
          A desarrumação na despensa transmite a mensagem de que vives no passado
          e que perdeste de vista o momento atual.
        </p>
      `
    },

    {
      id: 20,
      titulo: 'Debaixo dos móveis',
      conteudo: `
        <p>
          Se acumulas todo o tipo de coisas debaixo das camas, armários ou de
          qualquer outra peça de mobiliário, é sinal de que dás demasiada
          importância às aparências.
        </p>
      `
    },

    {
      id: 21,
      titulo: 'Por toda a casa',
      conteudo: `
        <p>
          Se a desordem impera por toda a casa, significa que poderás estar
          a ser dominado por sentimentos de desânimo, negligência ou apatia
          perante todos os aspetos da vida.
        </p>
      `
    },

    {
      id: 22,
      titulo: 'Acumulação de coisas novas',
      conteudo: `
        <p>
          Guardar roupa, livros, sapatos ou qualquer outro objeto comprado
          recentemente, e que mal se usa, indica que fazes demasiadas coisas
          ao mesmo tempo e que estás um pouco perdido.
        </p>

        <p>
          Se nos concentrarmos em erradicar este tipo de desordem, conseguiremos
          voltar a encontrar o rumo, seremos muito mais eficientes e
          sentir-nos-emos equilibrados.
        </p>
      `
    },

    {
      id: 23,
      titulo: 'Acumulação de coisas velhas',
      conteudo: `
        <p>
          Se o que guardamos são objetos que não usamos há muito tempo, significa
          que vivemos no passado e que deixamos que os pensamentos e ideias desse
          tempo nos dominem. Quando nos livrarmos deste tipo de desarrumação,
          veremos a mente abrir-se para novas abordagens.
        </p>
      `
    }

  ];


  /* =======================================================
     ESTATÍSTICAS
  ======================================================= */

  get totalAvaliados(): number {
    return this.objetos.length;
  }

  get totalLibertados(): number {
    return this.objetos.filter(objeto =>
      ['oferecer', 'doar', 'vender', 'reciclar'].includes(objeto.destino)
    ).length;
  }

  get totalDoados(): number {
    return this.objetos.filter(objeto =>
      ['oferecer', 'doar'].includes(objeto.destino)
    ).length;
  }

  get divisoesTrabalhadas(): number {
    const divisoesUnicas = new Set(
      this.objetos
        .map(objeto => objeto.divisao)
        .filter(divisao => !!divisao)
    );

    return divisoesUnicas.size;
  }


  /* =======================================================
     INICIALIZAÇÃO
  ======================================================= */

  ngOnInit(): void {
    this.carregarObjetos();
    this.carregarReflexoesCasa();
    this.carregarDesafio();

    this.limparFormularioObjeto();
  }


  /* =======================================================
     FUNÇÕES AUXILIARES
  ======================================================= */

  private gerarId(): string {
    return Date.now().toString(36) +
      Math.random().toString(36).substring(2, 10);
  }

  private dataAtual(): string {
    return new Date().toISOString();
  }

  private dataLocal(): string {
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private lerDados<T>(chave: string, valorPadrao: T): T {
    try {
      const dados = localStorage.getItem(chave);

      if (!dados) {
        return valorPadrao;
      }

      return JSON.parse(dados) as T;

    } catch (erro) {
      console.error(`Erro ao ler ${chave}:`, erro);
      return valorPadrao;
    }
  }

  private guardarDados(chave: string, dados: unknown): void {
    try {
      localStorage.setItem(chave, JSON.stringify(dados));
    } catch (erro) {
      console.error(`Erro ao guardar ${chave}:`, erro);
    }
  }

  private criarObjetoVazio(): ObjetoCasa {
    return {
      id: '',
      nome: '',
      divisao: '',
      categoria: '',

      gosta: '',
      fazFeliz: '',
      utiliza: '',
      precisa: '',

      padraoApego: '',
      reflexao: '',

      emocao: '',
      motivoManter: '',

      destino: 'manter',
      data: ''
    };
  }

  private criarReflexaoVazia(): ReflexaoCasa {
    return {
      id: '',
      divisao: '',
      carta: '',
      resposta: '',
      data: ''
    };
  }


  /* =======================================================
     OBJETOS: CARREGAR E NORMALIZAR
  ======================================================= */

  private carregarObjetos(): void {
    const dados = this.lerDados<unknown>(this.KEY_OBJETOS, []);

    if (!Array.isArray(dados)) {
      this.objetos = [];
      return;
    }

    this.objetos = dados.map((item: any) => ({
      id: item.id || this.gerarId(),

      nome: item.nome || '',
      divisao: item.divisao || '',
      categoria: item.categoria || '',

      gosta: item.gosta || '',
      fazFeliz: item.fazFeliz || '',
      utiliza: item.utiliza || '',
      precisa: item.precisa || '',

      padraoApego: item.padraoApego || '',
      reflexao: item.reflexao || '',

      emocao: item.emocao || item.emocaoObjeto || '',
      motivoManter: item.motivoManter || '',

      destino: item.destino || 'manter',
      data: item.data || this.dataAtual()

    }));

    this.guardarObjetos();
  }

  private guardarObjetos(): void {
    this.guardarDados(this.KEY_OBJETOS, this.objetos);
  }


  /* =======================================================
     OBJETOS: FORMULÁRIO
  ======================================================= */

  guardarObjeto(): void {

    const nome = this.nomeObjeto.trim();

    if (!nome) {
      alert('Indica o nome do objeto antes de guardar.');
      return;
    }

    if (!this.novaDivisao) {
      alert('Escolhe a divisão da casa.');
      return;
    }

    const novoObjeto: ObjetoCasa = {
      id: this.gerarId(),

      nome,
      divisao: this.novaDivisao,
      categoria: this.categoriaObjeto,

      gosta: this.gosta,
      fazFeliz: this.fazFeliz,
      utiliza: this.utiliza,
      precisa: this.precisa,

      padraoApego: this.padraoApegoObjeto,
      reflexao: this.reflexaoObjeto,

      emocao: this.emocaoObjeto,
      motivoManter: this.motivoManter,

      destino: this.destinoObjeto || 'manter',
      data: this.dataAtual()
    };

    this.objetos.unshift(novoObjeto);

    this.guardarObjetos();

    this.limparFormularioObjeto();
  }

  private limparFormularioObjeto(): void {
    this.nomeObjeto = '';
    this.novaDivisao = '';
    this.categoriaObjeto = '';

    this.gosta = '';
    this.fazFeliz = '';
    this.utiliza = '';
    this.precisa = '';

    this.padraoApegoObjeto = '';
    this.reflexaoObjeto = '';

    this.emocaoObjeto = '';
    this.motivoManter = '';

    this.destinoObjeto = 'manter';
  }


  /* =======================================================
     OBJETOS: EDITAR
  ======================================================= */

  iniciarEdicaoObjeto(objeto: ObjetoCasa): void {

    this.objetoEmEdicao = {
      ...objeto
    };
  }

  guardarEdicaoObjeto(): void {

    if (!this.objetoEmEdicao.id) {
      return;
    }

    if (!this.objetoEmEdicao.nome.trim()) {
      alert('O objeto precisa de ter um nome.');
      return;
    }

    if (!this.objetoEmEdicao.divisao) {
      alert('Escolhe a divisão do objeto.');
      return;
    }

    const indice = this.objetos.findIndex(
      objeto => objeto.id === this.objetoEmEdicao.id
    );

    if (indice === -1) {
      return;
    }

    const objetoOriginal = this.objetos[indice];

    this.objetos[indice] = {
      ...this.objetoEmEdicao,
      data: objetoOriginal.data
    };

    this.guardarObjetos();

    this.cancelarEdicaoObjeto();
  }

  cancelarEdicaoObjeto(): void {
    this.objetoEmEdicao = this.criarObjetoVazio();
  }

  eliminarObjeto(id: string): void {

    const confirmar = confirm(
      'Queres realmente eliminar esta avaliação?'
    );

    if (!confirmar) {
      return;
    }

    this.objetos = this.objetos.filter(
      objeto => objeto.id !== id
    );

    this.guardarObjetos();

    if (this.objetoEmEdicao.id === id) {
      this.cancelarEdicaoObjeto();
    }
  }


  /* =======================================================
     DESTINOS DOS OBJETOS
  ======================================================= */

  obterNomeDestino(destino: string): string {

    const nomes: Record<string, string> = {
      'manter': 'Manter',
      'oferecer': 'Oferecer',
      'doar': 'Doar',
      'vender': 'Vender',
      'reparar': 'Reparar',
      'reciclar': 'Reciclar',
      'decidir-depois': 'Decidir mais tarde'
    };

    return nomes[destino] || 'Sem decisão';
  }


  /* =======================================================
     CONVERSAS COM A CASA: CARREGAR
  ======================================================= */

  private carregarReflexoesCasa(): void {

    const dados = this.lerDados<unknown>(
      this.KEY_REFLEXOES,
      []
    );

    if (!Array.isArray(dados)) {
      this.reflexoesCasa = [];
      return;
    }

    this.reflexoesCasa = dados.map((item: any) => ({
      id: item.id || this.gerarId(),

      divisao: item.divisao || '',

      carta: item.carta || item.cartaDaCasa || '',
      resposta: item.resposta || item.respostaCasa || '',

      data: item.data || this.dataAtual()
    }));

    this.guardarReflexoesCasa();
  }

  private guardarReflexoesCasa(): void {
    this.guardarDados(
      this.KEY_REFLEXOES,
      this.reflexoesCasa
    );
  }


  /* =======================================================
     CONVERSAS COM A CASA: NOVO REGISTO
  ======================================================= */

  guardarReflexaoCasa(): void {

    if (!this.divisaoReflexao) {
      alert('Escolhe primeiro uma divisão.');
      return;
    }

    if (
      !this.cartaDaCasa.trim() &&
      !this.respostaCasa.trim()
    ) {
      alert('Escreve alguma coisa antes de guardar a conversa.');
      return;
    }

    const novaReflexao: ReflexaoCasa = {
      id: this.gerarId(),

      divisao: this.divisaoReflexao,

      carta: this.cartaDaCasa.trim(),
      resposta: this.respostaCasa.trim(),

      data: this.dataAtual()
    };

    this.reflexoesCasa.unshift(novaReflexao);

    this.guardarReflexoesCasa();

    this.divisaoReflexao = '';
    this.cartaDaCasa = '';
    this.respostaCasa = '';
  }


  /* =======================================================
     CONVERSAS COM A CASA: EDITAR
  ======================================================= */

  iniciarEdicaoReflexaoCasa(
    reflexao: ReflexaoCasa
  ): void {

    this.reflexaoCasaEmEdicao = {
      ...reflexao
    };
  }

  guardarEdicaoReflexaoCasa(): void {

    if (!this.reflexaoCasaEmEdicao.id) {
      return;
    }

    if (!this.reflexaoCasaEmEdicao.divisao) {
      alert('Escolhe uma divisão.');
      return;
    }

    if (
      !this.reflexaoCasaEmEdicao.carta.trim() &&
      !this.reflexaoCasaEmEdicao.resposta.trim()
    ) {
      alert('A conversa não pode ficar completamente vazia.');
      return;
    }

    const indice = this.reflexoesCasa.findIndex(
      reflexao =>
        reflexao.id === this.reflexaoCasaEmEdicao.id
    );

    if (indice === -1) {
      return;
    }

    const reflexaoOriginal = this.reflexoesCasa[indice];

    this.reflexoesCasa[indice] = {
      ...this.reflexaoCasaEmEdicao,
      data: reflexaoOriginal.data
    };

    this.guardarReflexoesCasa();

    this.cancelarEdicaoReflexaoCasa();
  }

  cancelarEdicaoReflexaoCasa(): void {
    this.reflexaoCasaEmEdicao = this.criarReflexaoVazia();
  }

  eliminarReflexaoCasa(id: string): void {

    const confirmar = confirm(
      'Queres realmente eliminar esta conversa?'
    );

    if (!confirmar) {
      return;
    }

    this.reflexoesCasa = this.reflexoesCasa.filter(
      reflexao => reflexao.id !== id
    );

    this.guardarReflexoesCasa();

    if (this.reflexaoCasaEmEdicao.id === id) {
      this.cancelarEdicaoReflexaoCasa();
    }
  }


  /* =======================================================
     DESAFIOS: CARREGAR
  ======================================================= */

  private carregarDesafio(): void {

    const dados = this.lerDados<any>(
      this.KEY_DESAFIOS,
      null
    );

    const hoje = this.dataLocal();

    if (
      dados &&
      dados.data === hoje &&
      Number.isInteger(dados.indice) &&
      dados.indice >= 0 &&
      dados.indice < this.desafios.length
    ) {

      this.desafioAtual = this.desafios[dados.indice];

      this.desafioConcluidoHoje = dados.concluido === true;

      return;
    }

    const indice = Math.floor(
      Math.random() * this.desafios.length
    );

    this.desafioAtual = this.desafios[indice];

    this.desafioConcluidoHoje = false;

    this.guardarEstadoDesafio(indice);
  }


  /* =======================================================
     DESAFIOS: GUARDAR ESTADO
  ======================================================= */

  private guardarEstadoDesafio(
    indice: number
  ): void {

    const dados = {
      data: this.dataLocal(),
      indice,
      concluido: this.desafioConcluidoHoje
    };

    this.guardarDados(this.KEY_DESAFIOS, dados);
  }


  /* =======================================================
     DESAFIOS: CONCLUIR
  ======================================================= */

  concluirDesafio(): void {

    if (this.desafioConcluidoHoje) {
      return;
    }

    this.desafioConcluidoHoje = true;

    const indice = this.desafios.indexOf(
      this.desafioAtual
    );

    this.guardarEstadoDesafio(indice);
  }


  /* =======================================================
     DESAFIOS: ESCOLHER OUTRO
  ======================================================= */

  novoDesafio(): void {

    if (this.desafios.length <= 1) {
      return;
    }

    let novoIndice = this.desafios.indexOf(
      this.desafioAtual
    );

    while (
      novoIndice === this.desafios.indexOf(this.desafioAtual)
    ) {

      novoIndice = Math.floor(
        Math.random() * this.desafios.length
      );

      if (this.desafios.length === 1) {
        break;
      }
    }

    this.desafioAtual = this.desafios[novoIndice];

    this.desafioConcluidoHoje = false;

    this.guardarEstadoDesafio(novoIndice);
  }


  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  voltar(): void {
    window.history.back();
  }

}