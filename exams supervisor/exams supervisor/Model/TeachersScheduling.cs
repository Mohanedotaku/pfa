namespace exams_supervisor.Model
{
	public class TeachersScheduling
	{
		public string? TeacherName { get; set; }
		public string? HourlyLoad { get; set; }
		public string? Grade { get; set; }
		public string? Type { get; set; }
		public List<SessionGroup>? Sessions { get; set; }
	}

	public class SessionGroup
	{
		public string? Date { get; set; }
		public List<string>? Sessions { get; set; }
	}
}
