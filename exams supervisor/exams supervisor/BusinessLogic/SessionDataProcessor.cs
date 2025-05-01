using exams_supervisor.Model;
using OfficeOpenXml;
using System.Text.RegularExpressions;

namespace exams_supervisor.BusinessLogic
{
	public class SessionDataProcessor
	{
		private  List<Session> _sessions = new List<Session>();
		public void LoadExcelData(Stream excelStream,List<int> sommeB)
		{
			try
			{
				using var package = new ExcelPackage(excelStream);

				_sessions.Clear();

				foreach (var ws in package.Workbook.Worksheets)
				{
					var type = ws.Name.Contains("Ex", StringComparison.OrdinalIgnoreCase)
								? Session.TypeOfExam.Exam
								: Session.TypeOfExam.DS;
					double delay = type == Session.TypeOfExam.DS ? 1.0 : 1.5;

					string? currentDay = null;
					DateTime? currentDate = null;
					int rows = ws.Dimension.End.Row;
					int cols = ws.Dimension.End.Column;
					var nameRegex = new Regex("\\(([^)]+)\\)");

					

					for (int r = 1; r <= rows; r++)
					{
						var dayText = ws.Cells[r, 1].Text.Trim();
						var dateText = ws.Cells[r, 2].Text.Trim();
						var timeText = ws.Cells[r, 3].Text.Trim();

						bool newDay = !string.IsNullOrEmpty(dayText);
						if (newDay && DateTime.TryParse(dateText, out var dt) && !string.IsNullOrEmpty(timeText))
						{
							currentDay = dayText;
							currentDate = dt;
						}
						else if (!newDay && (currentDate.HasValue && !string.IsNullOrEmpty(timeText)))
						{
							// continue same day
						}
						else
						{
							continue;
						}

						var num = MapTimeToSession(timeText,type);
						if (!num.HasValue || !currentDate.HasValue)
							continue;

						var teachers = new List<string>();
						for (int c = 4; c <= cols; c++)
						{
							var cell = ws.Cells[r, c].Text;
							if (string.IsNullOrEmpty(cell)) continue;
							var match = nameRegex.Match(cell);
							if (match.Success) teachers.Add(match.Groups[1].Value.Trim());
						}

						_sessions.Add(new Session
						{
							Type = type,
							NumSession = num.Value,
							Day = currentDay,
							Date = currentDate.Value,
							MaxSupervisor = 90,
							Delay = delay,
							ResponsiblesName = teachers.Distinct().ToList()
						});
					}
				}
				_sessions = _sessions
					.GroupBy(s => new { s.Date, s.Day, s.NumSession, s.Type })
					.Select(g => new Session
					{
						Date = g.Key.Date,
						Day = g.Key.Day,
						NumSession = g.Key.NumSession,
						Type = g.Key.Type,
						MaxSupervisor = 90,
						Delay = g.First().Delay,
						ResponsiblesName = g.SelectMany(s => s.ResponsiblesName).Distinct().ToList()
					}).OrderBy(s => s.Date)
						.ThenBy(s => s.NumSession)  // Add secondary ordering if needed
						.ToList();
				if(sommeB.Count >= _sessions.Count)
				{
					for (int i = 0; i < _sessions.Count; i++)
					{
						_sessions[i].MaxSupervisor = sommeB[i];
					}
				}



				Console.WriteLine($"Loaded {_sessions.Count} sessions from Excel file.");

			}
			catch (Exception ex)
			{
				throw new InvalidOperationException("Error processing Excel data.", ex);

			}
		}

		private Session.Num? MapTimeToSession(string time,Session.TypeOfExam type)
		{
			if (type.Equals(Session.TypeOfExam.DS))
			{
				if (time.Contains("08")) return Session.Num.S1;
				if (time.Contains("10")) return Session.Num.S2;
				if (time.Contains("12")) return Session.Num.S3;
				if (time.Contains("13")) return Session.Num.S4;
				if (time.Contains("14")) return Session.Num.S4;

			}else  {
				if (time.Contains("08")) return Session.Num.S1;
				if (time.Contains("10")&& time.Contains("12")) return Session.Num.S2;
				if (time.Contains("13") && time.Contains("14")) return Session.Num.S3;
				if (time.Contains("15") && time.Contains("16")) return Session.Num.S4;
				if (time.Contains("14") && time.Contains("15")) return Session.Num.S3;

			}
			
			return null;
		}
	

	// Return all sessions
		public List<Session> GetAllSessions()
		{
			return _sessions;
		}

		public List<String?> GetAlldaysSessions()
		{
			return _sessions.GroupBy(s => new { s.Date ,s.Day})
				.Select(g => g.First().Day)
				.ToList();
		}

		public List<DateTime> GetAlldateSessions()
		{
			return _sessions.GroupBy(s => new { s.Date, s.Day })
				.Select(g => g.First().Date)
				.ToList();
		}

	}
}