namespace exams_supervisor.BusinessLogic
{
	public class Test
	{
		//	private readonly List<TeacherInfo> _teachers = new List<TeacherInfo>();

		//	public void LoadExcelData(Stream excelStream)
		//	{


		//		using var package = new ExcelPackage(excelStream);
		//		var worksheet = package.Workbook.Worksheets[0]; // First worksheet

		//		int rowCount = worksheet.Dimension.Rows;
		//		int colCount = worksheet.Dimension.Columns;

		//		// Find header row (search first 10 rows)
		//		int headerRow = -1;
		//		int maxRowsToSearch = Math.Min(rowCount, 10);
		//		for (int row = 1; row <= maxRowsToSearch; row++)
		//		{
		//			int matchedHeaders = 0;
		//			for (int col = 1; col <= colCount; col++)
		//			{
		//				var header = worksheet.Cells[row, col].Text.Trim();
		//				if (header == "Nom Et Prénom Enseignant" ||
		//					header == "Grade" ||
		//					header == "Charge Surv")
		//				{
		//					matchedHeaders++;
		//				}
		//			}
		//			// Consider row as header if at least 2 headers are found
		//			if (matchedHeaders >= 2)
		//			{
		//				headerRow = row;
		//				break;
		//			}
		//		}

		//		if (headerRow == -1)
		//			throw new InvalidOperationException("Header row not found within the first 10 rows.");

		//		int startRow = headerRow + 1;

		//		// Find column indices by header names
		//		int? nameCol = null, gradeCol = null, loadCol = null;
		//		for (int col = 1; col <= colCount; col++)
		//		{
		//			var header = worksheet.Cells[headerRow, col].Text.Trim();
		//			if (header == "Nom Et Prénom Enseignant")
		//				nameCol = col;
		//			else if (header == "Grade")
		//				gradeCol = col;
		//			else if (header == "Charge Surv")
		//				loadCol = col;
		//		}

		//		// Validate that all required columns were found
		//		if (!nameCol.HasValue || !gradeCol.HasValue || !loadCol.HasValue)
		//			throw new InvalidOperationException("Required columns not found in Excel file.");

		//		_teachers.Clear(); // Clear previous data

		//		for (int row = startRow; row <= rowCount; row++)
		//		{
		//			if (string.IsNullOrWhiteSpace(worksheet.Cells[row, nameCol.Value].Text))
		//				continue; // Skip rows with no name

		//			var teacher = new TeacherInfo
		//			{
		//				fullName = worksheet.Cells[row, nameCol.Value].Text,
		//				grade = worksheet.Cells[row, gradeCol.Value].Text,
		//				hourlyLoad = int.TryParse(worksheet.Cells[row, loadCol.Value].Text, out var load) ? load : 0
		//			};

		//			_teachers.Add(teacher);
		//		}
		//		Console.WriteLine($"Loaded {_teachers.Count} teachers from Excel file.");
		//	}


		//	//public async Task LoadExcelDataAsync(Stream excelStream)
		//	//{
		//	//	ExcelPackage.License.SetNonCommercialPersonal("Mohaned");

		//	//	using var package = new ExcelPackage(excelStream);
		//	//	var worksheet = package.Workbook.Worksheets[0]; // First worksheet

		//	//	int rowCount = worksheet.Dimension.Rows;
		//	//	int colCount = worksheet.Dimension.Columns;
		//	//	int headerRow = 4; // Headers are in row 4 based on Excel structure
		//	//	int startRow = 5; // Data starts at row 5

		//	//	// Find column indices by header names
		//	//	int? nameCol = null, gradeCol = null, loadCol = null;
		//	//	for (int col = 1; col <= colCount; col++)
		//	//	{
		//	//		var header = worksheet.Cells[headerRow, col].Text.Trim();
		//	//		if (header == "Nom Et Prénom Enseignant") 
		//	//			nameCol = col;
		//	//		else if (header == "Grade")
		//	//			gradeCol = col;
		//	//		else if (header == "Charge Surv") 
		//	//			loadCol = col;
		//	//	}

		//	//	// Validate that all required columns were found
		//	//	if (!nameCol.HasValue || !gradeCol.HasValue || !loadCol.HasValue)
		//	//		throw new InvalidOperationException("Required columns not found in Excel file.");

		//	//	_teachers.Clear(); // Clear previous data

		//	//	for (int row = startRow; row <= rowCount; row++)
		//	//	{
		//	//		if (string.IsNullOrWhiteSpace(worksheet.Cells[row, nameCol.Value].Text))
		//	//			continue; // Skip rows with no name

		//	//		var teacher = new TeacherInfo
		//	//		{
		//	//			fullName = worksheet.Cells[row, nameCol.Value].Text,
		//	//			grade = worksheet.Cells[row, gradeCol.Value].Text,
		//	//			hourlyLoad = int.TryParse(worksheet.Cells[row, loadCol.Value].Text, out var load) ? load : 0
		//	//		};

		//	//		_teachers.Add(teacher);
		//	//	}
		//	//}

		//	// Search teachers by name, grade, or hourly load range
		//	public IEnumerable<TeacherInfo> SearchTeachers(
		//		string? name = null,
		//		string? grade = null,
		//		int? minHourlyLoad = null,
		//		int? maxHourlyLoad = null)
		//	{
		//		var query = _teachers.AsQueryable();

		//		if (!string.IsNullOrEmpty(name))
		//			query = query.Where(t => t.fullName != null && t.fullName.Contains(name, StringComparison.OrdinalIgnoreCase));

		//		if (!string.IsNullOrEmpty(grade))
		//			query = query.Where(t => t.grade != null && t.grade.Equals(grade, StringComparison.OrdinalIgnoreCase));

		//		if (minHourlyLoad.HasValue)
		//			query = query.Where(t => t.hourlyLoad >= minHourlyLoad.Value);

		//		if (maxHourlyLoad.HasValue)
		//			query = query.Where(t => t.hourlyLoad <= maxHourlyLoad.Value);

		//		return query.ToList();
		//	}

		//	// Return all teachers
		//	public List<TeacherInfo> GetAllTeachers()
		//	{
		//		return _teachers;
		//	}
	}
}
