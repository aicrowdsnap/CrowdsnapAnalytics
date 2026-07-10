export interface PreferenceItem {
  answer: string;
  count: number;
  percentage: number;
  color: string;
}

export const STAFF_DATA: PreferenceItem[] = [
  { answer: 'Ridmi Kavindya', count: 2, percentage: 25, color: '#0B4D9C' },
  { answer: 'Buddini Darsha', count: 2, percentage: 25, color: '#105CB3' },
  { answer: 'Noyeli Yalindi', count: 2, percentage: 25, color: '#1B6DCB' },
  { answer: 'Dilani Dinushika', count: 1, percentage: 13, color: '#3582E1' },
  { answer: 'Kavindi Ama', count: 1, percentage: 13, color: '#5599EB' },
  { answer: 'Other Answers', count: 0, percentage: 0, color: '#88B8F6' },
];