/** 中正高工公開 Google 日曆（對應學校 embed 日曆來源） */
export interface SchoolGoogleCalendarSource {
  id: string;
  label: string;
  /** 預設勾選同步 */
  defaultSelected: boolean;
}

export const SCHOOL_GOOGLE_CALENDARS: SchoolGoogleCalendarSource[] = [
  {
    id: 'c_4fae35905a29d8bca686782f5256522057dbb209a95f92e9ba98dbaa6a431f6f@group.calendar.google.com',
    label: '教務處',
    defaultSelected: true,
  },
  {
    id: 'zh-tw.taiwan#holiday@group.v.calendar.google.com',
    label: '國定假日',
    defaultSelected: true,
  },
  {
    id: 'c_f06f440a94a1f0a78bbeab3dd77efeb0805f94dd2039c7b96f95f380a2e66760@group.calendar.google.com',
    label: '實習處',
    defaultSelected: true,
  },
  {
    id: 'c_4b0794ed20d29e2cb3410db729c92d0586d14f65edad8bbb836cf70fe3f5ce87@group.calendar.google.com',
    label: '學務處',
    defaultSelected: true,
  },
  {
    id: 'c_4a1579e6b8a1be92e94860760708e3631fd34d52d00d3957cb7d98cef9a24746@group.calendar.google.com',
    label: '圖書館',
    defaultSelected: false,
  },
  {
    id: 'c_07447754c22a8976cc38828363923c320226304433de41658ccc899cd45601bc@group.calendar.google.com',
    label: '輔導處',
    defaultSelected: false,
  },
  {
    id: 'c_50de6315be25d2b1e1759ddc3812f56f8101dbf23fb869d70892b6ff20cdf7ce@group.calendar.google.com',
    label: '總務處',
    defaultSelected: false,
  },
  {
    id: 'c_5d2672b305cc8c13db60a51eef993242c339a644f0658e9ba4593d02d8c1f182@group.calendar.google.com',
    label: '秘書室',
    defaultSelected: false,
  },
  {
    id: 'ccvsns@mail2.ccvs.kh.edu.tw',
    label: '進修部',
    defaultSelected: false,
  },
  {
    id: 'c_0afe1e3de281b51bd789648392e993823f9de235f07cff46e8b1a400bb325595@group.calendar.google.com',
    label: '教官室',
    defaultSelected: false,
  },
];

export const SCHOOL_GOOGLE_CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/u/0/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=Asia/Taipei&title=%E4%B8%AD%E6%AD%A3%E9%AB%98%E5%B7%A5&src=Y2N2c25zQG1haWwyLmNjdnMua2guZWR1LnR3&src=Y180YTE1NzllNmI4YTFiZTkyZTk0ODYwNzYwNzA4ZTM2MzFmZDM0ZDUyZDAwZDM5NTdjYjdkOThjZWY5YTI0NzQ2QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y180YjA3OTRlZDIwZDI5ZTJjYjM0MTBkYjcyOWM5MmQwNTg2ZDE0ZjY1ZWRhZDhiYmI4MzZjZjcwZmUzZjVjZTg3QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y19mMDZmNDQwYTk0YTFmMGE3OGJiZWFiM2RkNzdlZmViMDgwNWY5NGRkMjAzOWM3Yjk2Zjk1ZjM4MGEyZTY2NzYwQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y180ZmFlMzU5MDVhMjlkOGJjYTY4Njc4MmY1MjU2NTIyMDU3ZGJiMjA5YTk1ZjkyZTliYTk4ZGJhYTZhNDMxZjZmQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y18wYWZlMWUzZGUyODFiNTFiZDc4OTY0ODM5MmU5OTM4MjNmOWRlMjM1ZjA3Y2ZmNDZlOGIxYTQwMGJiMzI1NTk1QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y181ZDI2NzJiMzA1Y2M4YzEzZGI2MGE1MWVlZjk5MzI0MmMzMzlhNjQ0ZjA2NThlOWJhNDU5M2QwMmQ4YzFmMTgyQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y181MGRlNjMxNWJlMjVkMmIxZTE3NTlkZGMzODEyZjU2ZjgxMDFkYmYyM2ZiODY5ZDcwODkyYjZmZjIwY2RmN2NlQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y18wNzQ0Nzc1NGMyMmE4OTc2Y2MzODgyODM2MzkyM2MzMjAyMjYzMDQ0MzNkZTQxNjU4Y2NjODk5Y2Q0NTYwMWJjQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=emgtdHcudGFpd2FuI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%239E69AF&color=%23C0CA33&color=%23B39DDB&color=%23E4C441&color=%233F51B5&color=%237986CB&color=%23D50000&color=%23616161&color=%23F4511E&color=%230B8043';
