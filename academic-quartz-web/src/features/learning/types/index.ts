export interface Learning {
  id: string;
  title: string;
  description: string;
  period: {
    name: string;
    year: number;
  };
  subject: {
    name: string;
  };
  teacher: {
    name: string;
    lastname: string;
  };
  grade: {
    name: string;
  };
}
