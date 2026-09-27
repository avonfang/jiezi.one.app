export const TUTORIAL_CATEGORIES = ['AI 入门', '上手实操', 'Prompt 技巧', 'AI 副业'] as const;

export type Tutorial = {
  id: string;
  cat: string;
  emoji: string;
  mins: string;
  title: string;
  desc: string;
  paras: string[];
  prompt?: string;
  task: string[];
  published: boolean;
};
