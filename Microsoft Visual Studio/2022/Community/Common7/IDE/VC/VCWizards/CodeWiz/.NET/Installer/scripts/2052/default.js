// Copyright (c) Microsoft Corporation. All rights reserved.

function OnPrep(selProj, selObj)
{
	var L_WizardDialogTitle_Text = "Installer Class Wizard";
	return PrepCodeWizard(selProj, L_WizardDialogTitle_Text);
}

function OnFinish(selProj, selObj)
{
	wizard.AddSymbol("NATIVE_PROJECT",IsNativeProject(selProj));
	try
	{
		if (!IsMCppProject(selProj))
			return VS_E_WIZARDBACKBUTTONPRESS;
		if (!PrepareToAddManagedClass(selProj))
			return VS_E_WIZARDBACKBUTTONPRESS;
		AddReferencesForInstaller(selProj);
		AddFilesToProjectWithInfFile(selProj, wizard.FindSymbol("PROJECT_NAME"), selObj);
		selProj.Object.Save();
	}
	catch (e)
	{
		if (e.description.length > 0)
			SetErrorInfo(e);
		return e.number;
	}
}

function SetFileProperties(oFileItem, strFileName)
{
	if (strFileName == "NewInstaller.h")
	{
		oFileItem.Object.FileType = eFileTypeCppClass;
	} else if (strFileName == "NewInstaller.cpp") {
		if (wizard.FindSymbol("NATIVE_PROJECT")) {
			SetFileLevelClr(oFileItem);
		}
	}
		
	return false;
}

function GetTargetName(strName, strProjectName, strResPath, strHelpPath)
{
	if (strName.toLowerCase() == "newinstaller.cpp")
		return wizard.FindSymbol("SAFE_ITEM_NAME") + ".cpp";
	if (strName.toLowerCase() == "newinstaller.h")
		return wizard.FindSymbol("SAFE_ITEM_NAME") + ".h";
	return strName;
}

