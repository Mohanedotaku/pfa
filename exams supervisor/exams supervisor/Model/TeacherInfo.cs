using System.ComponentModel.DataAnnotations;

namespace exams_supervisor.Model
{
	public class TeacherInfo
	{
		
		public required string fullName { get; set; }
		public required string grade { get; set; }
		public int hourlyLoad  { get; set; }

	}
}
