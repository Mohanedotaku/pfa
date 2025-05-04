using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography.X509Certificates;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace exams_supervisor.Model
{
	public class Session
	{
		public enum Num
		{
			S1, // 8:30 AM - 9:30 AM (DS) or 8:30 AM - 10:00 AM (Exam)
			S2, // 10:15 AM - 11:15 AM (DS) or 10:15 AM - 11:45 AM (Exam)
			S3, // 12:00 PM - 1:00 PM (DS) or 12:00 PM - 1:30 PM (Exam)
			S4  // 1:45 PM - 2:45 PM (DS) or 1:45 PM - 3:15 PM (Exam)
		}

		public enum TypeOfExam
		{
			DS,    // DS (Departmental Exam)
			Exam   // Final Exam
		}

		public TypeOfExam Type { get; set; }
		public Num NumSession { get; set; }
		public string? Day { get; set; }
		public DateTime Date { get; set; }
		public int MaxSupervisor { get; set; } // Maximum number of supervisors
		public double Delay { get; set; }      // Duration in hours (e.g., 1.0 for DS, 1.5 for Exam)
		public List<string> ResponsibleName { get; set; } = new List<string>(); // List of responsible teachers
	}
}
