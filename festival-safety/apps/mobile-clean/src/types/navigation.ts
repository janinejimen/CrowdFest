export type RootStackParamList = {
  UserType: undefined;
  Login: { userType: 'attendee' | 'organizer' };
  Home: undefined;
  EventHome: { eventId: string; eventName: string };
};

export type EventTabParamList = {
  EventMain: undefined;
  Chatbot: undefined;
  Emergency: undefined;
};