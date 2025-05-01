using exams_supervisor.Model;
using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace exams_supervisor.BusinessLogic
{
	public class TeacherDataProcessor
	{
		private readonly List<TeacherInfo> _teachers = new();
		private readonly List<int> _sommeBValues = new();

		public void LoadExcelData(Stream excelStream,List<Session> sessions)
		{
			try
			{

				using var package = new ExcelPackage(excelStream);
				var worksheets = package.Workbook.Worksheets;
				if (worksheets == null || worksheets.Count == 0)
					throw new InvalidOperationException("Excel file contains no worksheets.");

				// 1) Extract teacher data from the first non-empty sheet
				var teacherSheet = worksheets.FirstOrDefault(ws => ws.Dimension != null)
					?? throw new InvalidOperationException("No non-empty worksheet found for teacher data.");

				var (headerRow, nameCol, gradeCol, loadCol) = FindHeader(teacherSheet);
				ReadTeacherData(teacherSheet, headerRow, nameCol, gradeCol, loadCol);

				// 2) Extract "Somme B" values from any sheet by finding the row containing "Somme B"
				ExtractSommeBValues(worksheets,sessions);

				Console.WriteLine($"Loaded {_teachers.Count} teachers and {_sommeBValues.Count} Somme B values from Excel file.");
			}
			catch (Exception ex)
			{
				throw new InvalidOperationException($"Error processing Excel file: {ex.Message}", ex);
			}
		}
		public List<TeacherInfo> GetAllTeachers() => _teachers;


		public List<int> GetSommeBValues() => _sommeBValues;

		public IEnumerable<TeacherInfo> SearchTeachers(
			string? name = null,
			string? grade = null,
			int? minHourlyLoad = null,
			int? maxHourlyLoad = null)
		{
			return _teachers.Where(t =>
				(string.IsNullOrEmpty(name) || t.fullName.Contains(name, StringComparison.OrdinalIgnoreCase)) &&
				(string.IsNullOrEmpty(grade) || t.grade.Equals(grade, StringComparison.OrdinalIgnoreCase)) &&
				(!minHourlyLoad.HasValue || t.hourlyLoad >= minHourlyLoad) &&
				(!maxHourlyLoad.HasValue || t.hourlyLoad <= maxHourlyLoad)
			);
		}

		#region Private Helpers

		private void ReadTeacherData(ExcelWorksheet ws, int headerRow, int nameCol, int gradeCol, int loadCol)
		{
			if (ws.Dimension == null)
				throw new InvalidOperationException($"Worksheet '{ws.Name}' has no data.");

			_teachers.Clear();
			int totalRows = ws.Dimension.End.Row;

			for (int row = headerRow + 1; row <= totalRows; row++)
			{
				var rawName = ws.Cells[row, nameCol]?.Text.Trim();
				if (string.IsNullOrEmpty(rawName))
					continue;

				int.TryParse(ws.Cells[row, loadCol]?.Text.Trim(), out int load);

				_teachers.Add(new TeacherInfo
				{
					fullName = rawName,
					grade = ws.Cells[row, gradeCol]?.Text.Trim() ?? string.Empty,
					hourlyLoad = load
				});
			}
		}

		private void ExtractSommeBValues(IEnumerable<ExcelWorksheet> worksheets,List<Session> sessions)
		{
			_sommeBValues.Clear();
			bool found = false;

			foreach (var ws in worksheets)
			{
				if (ws.Dimension == null)
					continue;

				int totalRows = ws.Dimension.End.Row;
				int totalCols = ws.Dimension.End.Column;

				for (int row = 1; row <= totalRows; row++)
				{
					for (int col = 1; col <= totalCols; col++)
					{
						var cellText = ws.Cells[row, col]?.Text.Trim();
						if (string.Equals(cellText, "Somme B", StringComparison.OrdinalIgnoreCase))
						{
							// Found the Somme B header; extract all integers in this row
							found = true;
							for (int c = 1; c <= totalCols; c++)
							{
								var valueText = ws.Cells[row, c]?.Text.Trim();
								if (int.TryParse(valueText, out int value))
								{
									_sommeBValues.Add(value);
								}
							}
							break;
						}
					}
					if (found)
						break;
				}
				if (found)
					break;
			}

			if (!found)
				Console.WriteLine("Warning: 'Somme B' row not found in any worksheet.");
			if(sessions.Count > 0)
			{
				for (int i = 0; i < sessions.Count; i++)
				{
					sessions[i].MaxSupervisor = _sommeBValues[i];
				}
			}
		}

		private static (int headerRow, int nameCol, int gradeCol, int loadCol) FindHeader(ExcelWorksheet ws)
		{
			if (ws.Dimension == null)
				throw new InvalidOperationException($"Worksheet '{ws.Name}' has no data for header search.");

			int maxSearchRows = Math.Min(ws.Dimension.End.Row, 10);
			int headerRow = -1;
			int? nameCol = null, gradeCol = null, loadCol = null;
			string[] headersToFind = { "Nom Et Prénom Enseignant", "Grade", "Charge Surv" };

			for (int row = 1; row <= maxSearchRows; row++)
			{
				var cells = ws.Cells[row, 1, row, ws.Dimension.End.Column]
					.Select(c => c.Text?.Trim() ?? string.Empty)
					.ToArray();

				if (cells.Count(c => headersToFind.Contains(c, StringComparer.OrdinalIgnoreCase)) >= 2)
				{
					headerRow = row;
					for (int col = 1; col <= cells.Length; col++)
					{
						var text = cells[col - 1];
						if (text.Equals(headersToFind[0], StringComparison.OrdinalIgnoreCase)) nameCol = col;
						if (text.Equals(headersToFind[1], StringComparison.OrdinalIgnoreCase)) gradeCol = col;
						if (text.Equals(headersToFind[2], StringComparison.OrdinalIgnoreCase)) loadCol = col;
					}
					break;
				}
			}

			if (headerRow < 0 || nameCol is null || gradeCol is null || loadCol is null)
				throw new InvalidOperationException(
					$"Unable to locate required teacher headers within the first 10 rows of sheet '{ws.Name}'.");

			return (headerRow, nameCol.Value, gradeCol.Value, loadCol.Value);
		}

		#endregion


		
	}

}
