export const CRM_CONFIG = {
  contactsModule: "Contacts",
  mattersModule: "Applications",
  contactMattersRelatedList: "Applications",
  matterHistoryRelatedLists: ["Application_History", "Applications_History"],
  fields: {
    contactName: ["Full_Name", "Name"],
    msFileNumber: ["ID_Number", "MS_File_No", "MS_File_Number"],
    matterNumber: ["Name", "Matter_No"],
    matterStage: ["Current_Stage"],
    primaryContact: ["Contact_Name", "Contact"],
    historyDate: ["Date", "Created_Time"],
    historyOwner: ["Owner"],
    historyStage: ["Current_Stage"],
    historyCategory: ["History_Type"],
    historyActivityType: ["History_Result"],
    historyDuration: ["Duration_Min", "Duration"],
  },
};

export const REPORT_DEFAULTS = {
  pageSize: 200,
  maxPagesPerRelatedList: 50,
};
