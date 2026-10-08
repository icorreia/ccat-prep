/**
 * Sentence-completion items. `___` marks each blank; `answer` and every entry in `wrong` hold
 * one word (or phrase) per blank. Every wrong option fits the grammar but misses the logic
 * signal (despite, although, so … that, because), so only the answer makes sense.
 *
 * `signal`: 'contrast' (although, despite, but, yet) or 'cause' (because, so … that, therefore).
 * `tier`: how rare the answer words are (1 everyday … 5 rare), assigned by hand.
 * Names in {braces} are filled in at random.
 */

export interface SentenceItem {
  text: string;
  answer: string[];
  wrong: string[][];
  signal?: 'contrast' | 'cause';
  tier: 1 | 2 | 3 | 4 | 5;
}

export const SENTENCES: SentenceItem[] = [
  // One blank, no signal word: plain vocabulary in context.
  { text: 'The baby was so tired that she fell ___ in her chair.', answer: ['asleep'], wrong: [['awake'], ['alert'], ['upright'], ['busy']], signal: 'cause', tier: 1 },
  { text: 'We needed an umbrella because it was ___ outside.', answer: ['raining'], wrong: [['sunny'], ['dry'], ['bright'], ['calm']], signal: 'cause', tier: 1 },
  { text: '{name} studied every night, so she felt ___ before the exam.', answer: ['prepared'], wrong: [['unprepared'], ['lost'], ['confused'], ['careless']], signal: 'cause', tier: 1 },
  { text: 'The shop was closed, so we could not ___ any bread.', answer: ['buy'], wrong: [['bake'], ['eat'], ['grow'], ['throw']], signal: 'cause', tier: 1 },
  { text: 'Despite the heavy rain, the match was not ___.', answer: ['cancelled'], wrong: [['played'], ['watched'], ['enjoyed'], ['started']], signal: 'contrast', tier: 1 },
  { text: 'Although the test was short, it was very ___.', answer: ['difficult'], wrong: [['brief'], ['quick'], ['easy'], ['simple']], signal: 'contrast', tier: 1 },
  { text: 'The room was dark, but {name} could still ___ the door.', answer: ['find'], wrong: [['lose'], ['miss'], ['ignore'], ['forget']], signal: 'contrast', tier: 1 },

  // One blank, everyday-to-moderate words.
  { text: 'Her explanation was so ___ that even beginners understood it.', answer: ['lucid'], wrong: [['vague'], ['lengthy'], ['confusing'], ['technical']], signal: 'cause', tier: 3 },
  { text: 'The new manager was ___: she listened to every opinion before deciding.', answer: ['open-minded'], wrong: [['stubborn'], ['impatient'], ['secretive'], ['careless']], tier: 2 },
  { text: 'Because the instructions were ___, nobody knew what to do.', answer: ['unclear'], wrong: [['detailed'], ['helpful'], ['precise'], ['simple']], signal: 'cause', tier: 2 },
  { text: 'The bridge was ___ after the storm, so the road was closed.', answer: ['damaged'], wrong: [['repaired'], ['painted'], ['crowded'], ['opened']], signal: 'cause', tier: 2 },
  { text: 'Even though he was ___, {name} spoke confidently in front of the crowd.', answer: ['nervous'], wrong: [['relaxed'], ['prepared'], ['calm'], ['famous']], signal: 'contrast', tier: 2 },
  { text: 'The food was ___, so the guests asked for second helpings.', answer: ['delicious'], wrong: [['bland'], ['cold'], ['burnt'], ['expensive']], signal: 'cause', tier: 2 },
  { text: 'The museum is usually crowded, yet today it was almost ___.', answer: ['empty'], wrong: [['full'], ['busy'], ['packed'], ['noisy']], signal: 'contrast', tier: 2 },
  { text: 'The report was ___: it covered every detail of the project.', answer: ['thorough'], wrong: [['brief'], ['careless'], ['incomplete'], ['vague']], tier: 3 },
  { text: 'Because the evidence was ___, the jury could not reach a verdict.', answer: ['inconclusive'], wrong: [['overwhelming'], ['convincing'], ['clear'], ['decisive']], signal: 'cause', tier: 4 },
  { text: 'Although the plan seemed ___ at first, it turned out to be quite simple.', answer: ['complicated'], wrong: [['easy'], ['obvious'], ['basic'], ['clear']], signal: 'contrast', tier: 2 },
  { text: 'The speaker was so ___ that the audience began to fall asleep.', answer: ['monotonous'], wrong: [['lively'], ['engaging'], ['funny'], ['dramatic']], signal: 'cause', tier: 4 },
  { text: 'Water is ___ in the desert, so travellers carry extra bottles.', answer: ['scarce'], wrong: [['plentiful'], ['cheap'], ['cold'], ['clean']], signal: 'cause', tier: 3 },
  { text: 'Despite his ___ manner, the professor was kind to his students.', answer: ['gruff'], wrong: [['gentle'], ['warm'], ['friendly'], ['kind']], signal: 'contrast', tier: 4 },
  { text: 'The company\'s profits were ___, rising steadily every quarter.', answer: ['flourishing'], wrong: [['declining'], ['collapsing'], ['shrinking'], ['stagnant']], tier: 4 },
  { text: 'She was known for her ___: she never spent money she did not need to.', answer: ['frugality'], wrong: [['generosity'], ['extravagance'], ['wealth'], ['laziness']], tier: 4 },
  { text: 'His ___ remarks offended several people at the meeting.', answer: ['tactless'], wrong: [['thoughtful'], ['polite'], ['tactful'], ['kind']], tier: 3 },
  { text: 'The witness gave an ___ account, so the police trusted her.', answer: ['accurate'], wrong: [['inaccurate'], ['unlikely'], ['unclear'], ['angry']], signal: 'cause', tier: 2 },
  { text: 'The scientist remained ___ about the results until the experiment was repeated.', answer: ['skeptical'], wrong: [['certain'], ['convinced'], ['excited'], ['careless']], tier: 4 },
  { text: 'Though usually ___, {name} talked for hours at the party.', answer: ['reticent'], wrong: [['talkative'], ['chatty'], ['outgoing'], ['loud']], signal: 'contrast', tier: 5 },
  { text: 'The treaty was meant to ___ the conflict, but fighting broke out again within a week.', answer: ['end'], wrong: [['start'], ['prolong'], ['worsen'], ['begin']], signal: 'contrast', tier: 1 },
  { text: 'The ___ rules left no room for interpretation.', answer: ['explicit'], wrong: [['vague'], ['ambiguous'], ['flexible'], ['unwritten']], tier: 4 },
  { text: 'Because the medicine had ___ side effects, doctors prescribed it only as a last resort.', answer: ['severe'], wrong: [['mild'], ['minor'], ['pleasant'], ['few']], signal: 'cause', tier: 2 },
  { text: 'Her ___ attitude made her popular: she always expected things to turn out well.', answer: ['optimistic'], wrong: [['pessimistic'], ['gloomy'], ['bitter'], ['anxious']], tier: 3 },
  { text: 'The once-___ town is now nearly deserted.', answer: ['bustling'], wrong: [['quiet'], ['empty'], ['abandoned'], ['sleepy']], signal: 'contrast', tier: 4 },
  { text: 'The critic\'s review was ___: it praised nothing about the film.', answer: ['scathing'], wrong: [['glowing'], ['flattering'], ['balanced'], ['enthusiastic']], tier: 5 },
  { text: 'The negotiator tried to ___ both sides, but neither would compromise.', answer: ['reconcile'], wrong: [['divide'], ['provoke'], ['ignore'], ['separate']], signal: 'contrast', tier: 4 },

  // Two blanks.
  { text: 'Although the critic was usually ___, she found the film surprisingly ___.', answer: ['harsh', 'moving'], wrong: [['harsh', 'dull'], ['kind', 'moving'], ['generous', 'pleasant'], ['strict', 'boring']], signal: 'contrast', tier: 2 },
  { text: 'The task seemed ___ at first, but it soon became ___.', answer: ['easy', 'difficult'], wrong: [['easy', 'simple'], ['hard', 'difficult'], ['boring', 'dull'], ['hard', 'impossible']], signal: 'contrast', tier: 1 },
  { text: 'Because the team was ___, the project was finished ___.', answer: ['efficient', 'early'], wrong: [['efficient', 'late'], ['disorganized', 'early'], ['slow', 'quickly'], ['careless', 'perfectly']], signal: 'cause', tier: 3 },
  { text: 'Far from being ___, the new policy was ___ by almost everyone.', answer: ['controversial', 'welcomed'], wrong: [['controversial', 'opposed'], ['popular', 'welcomed'], ['popular', 'praised'], ['unpopular', 'rejected']], signal: 'contrast', tier: 4 },
  { text: 'The author\'s early novels were ___, but her later work became famously ___.', answer: ['verbose', 'concise'], wrong: [['verbose', 'wordy'], ['brief', 'concise'], ['short', 'brief'], ['lengthy', 'long']], signal: 'contrast', tier: 4 },
  { text: 'Since the data were ___, the conclusions drawn from them were ___.', answer: ['flawed', 'unreliable'], wrong: [['flawed', 'sound'], ['accurate', 'unreliable'], ['complete', 'trustworthy'], ['precise', 'valid']], signal: 'cause', tier: 3 },
  { text: 'The once ___ economy has become ___ after years of reform.', answer: ['stagnant', 'dynamic'], wrong: [['stagnant', 'sluggish'], ['thriving', 'dynamic'], ['booming', 'prosperous'], ['weak', 'feeble']], signal: 'contrast', tier: 4 },
];

/** Names used for {name} placeholders. */
export const NAMES = ['Ana', 'Maya', 'Sara', 'Ines', 'Leah', 'Nadia', 'Priya', 'Zoe'];
