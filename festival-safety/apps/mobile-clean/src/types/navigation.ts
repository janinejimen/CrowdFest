export type RootStackParamList = {
  UserType: undefined;
  Login: { userType: 'attendee' | 'organizer' };
  Home: undefined;
  EventHome: { eventId: string; eventName: string };
  Profile: undefined;
  CrowdMap: undefined;
};

export type EventTabParamList = {
  EventMain: undefined;
  CrowdMapTab: undefined;
  Chatbot: undefined;
  Emergency: undefined;
};