// Copyright (c) Microsoft Corporation. All rights reserved.

function OnPrep(selProj, selObj)
{
	var L_WizardDialogTitle_Text = "XML Schema Wizard";
	return PrepCodeWizard(selProj, L_WizardDialogTitle_Text);
}

function OnFinish(selProj, selObj)
{
    var oldSuppressUIValue = true;
	try
	{
        oldSuppressUIValue = dte.SuppressUI;
		var strProjectName		= wizard.FindSymbol("PROJECT_NAME");

		var strItemName = wizard.FindSymbol("ITEM_NAME");
		// Since item name is a file name for us, strip off the extension
		var iDotPos = strItemName.lastIndexOf('.');
		if (iDotPos != -1)
		{
			strItemName = strItemName.substr(0, iDotPos);
		}
		wizard.AddSymbol("EXTENSIONLESS_ITEM_NAME", strItemName);

		AddFilesToProjectWithInfFile(selProj, strProjectName, selObj);
		selProj.Object.Save();
	}
	catch(e)
	{
		if( e.description.length > 0 )
			SetErrorInfo(e);
		return e.number;
    }
    finally
    {
   		dte.SuppressUI = oldSuppressUIValue;
   		if( InfFile )
			InfFile.Delete();
    }
}

function SetFileProperties(oFileItem, strFileName)
{
	for (var fileCfgIdx = 1; fileCfgIdx <= oFileItem.Object.FileConfigurations.Count; fileCfgIdx++)
	{
		var fileCfg = oFileItem.Object.FileConfigurations.Item(fileCfgIdx);
		fileCfg.ExcludedFromBuild = true;
	}
	return false;
}

function GetTargetName(strName, strProjectName, strResPath, strHelpPath)
{
	try
	{
		var strTarget = strName;

		if (strName.substr(0, 12) == "NewXMLSchema")
		{
			var strItemName = wizard.FindSymbol("EXTENSIONLESS_ITEM_NAME");
			var extension = strName.substr(12);
			strTarget = GetFileNameUnique(strItemName, extension);
		}

		return strTarget;
	}
	catch(e)
	{
		throw e;
	}
}
