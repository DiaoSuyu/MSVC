// (c) Microsoft Corporation
var vsViewKindPrimary                     = "{00000000-0000-0000-0000-000000000000}";
var vsViewKindDebugging                   = "{7651A700-06E5-11D1-8EBD-00A0C90F26EA}";
var vsViewKindCode                        = "{7651A701-06E5-11D1-8EBD-00A0C90F26EA}";
var vsViewKindDesigner                    = "{7651A702-06E5-11D1-8EBD-00A0C90F26EA}";
var vsViewKindTextView                    = "{7651A703-06E5-11D1-8EBD-00A0C90F26EA}";

var GUID_ItemType_PhysicalFolder          = "{6BB5F8EF-4483-11D3-8BCF-00C04F8EC28C}";
var GUID_ItemType_VirtualFolder           = "{6BB5F8F0-4483-11D3-8BCF-00C04F8EC28C}";
var GUID_ItemType_PhysicalFile            = "{6BB5F8EE-4483-11D3-8BCF-00C04F8EC28C}";

var GUID_Deployment_TemplatePath          = "{54435603-DBB4-11D2-8724-00A0C9A8B90C}";

var gbExceptionThrown = false;

    var vsCMFunctionConstructor = 1;

    var vsCMAddPositionInvalid = -3;
    var vsCMAddPositionDefault = -2;
    var vsCMAddPositionEnd = -1;
    var vsCMAddPositionStart = 0;
//
    var vsCMAccessPublic = 1;
    var vsCMAccessDefault = 32;
//
    var vsCMWhereInvalid = -1;
    var vsCMWhereDefault = 0;
    var vsCMWhereDeclaration = 1;
    var vsCMWhereDefinition = 2;
//
    var vsCMValidateFileExtNone = -1;
    var vsCMValidateFileExtCpp = 0;
    var vsCMValidateFileExtCppSource = 1;
    var vsCMValidateFileExtHtml = 2;
//
    var vsCMElementClass    = 1;
    var vsCMElementFunction = 2;
    var vsCMElementVariable = 3;
    var vsCMElementProperty = 4;
    var vsCMElementNamespace= 5;
    var vsCMElementInterface= 8;
    var vsCMElementStruct   = 11;   
    var vsCMElementUnion    = 12;
    var vsCMElementIDLCoClass=33;
    var vsCMElementVCBase   = 37;


// VS-specific HRESULT failure codes
//
    var OLE_E_PROMPTSAVECANCELLED = -2147221492;
    var VS_E_PROJECTALREADYEXISTS = -2147753952;
    var VS_E_PACKAGENOTLOADED = -2147753953;
    var VS_E_PROJECTNOTLOADED = -2147753954;
    var VS_E_SOLUTIONNOTOPEN = -2147753955;
    var VS_E_SOLUTIONALREADYOPEN = -2147753956;
    var VS_E_INCOMPATIBLEDOCDATA = -2147753962;
    var VS_E_UNSUPPORTEDFORMAT = -2147753963;
    var VS_E_WIZARDBACKBUTTONPRESS = -2147213313;
    var VS_E_WIZCANCEL = VS_E_WIZARDBACKBUTTONPRESS;

////////////////////////////////////////////////////////


/******************************************************************************
 Description: Sets the error info
  nErrNumber: Error code
  strErrDesc: Error description
******************************************************************************/
function SetErrorInfo(oErrorObj)
{
    var oWizard;
    try
    {
        oWizard = wizard;
    }
    catch(e)
    {
        oWizard = window.external;
    }

    try
    {
        var strErrorText = "";

        if(oErrorObj.description.length != 0)
        {
            strErrorText = oErrorObj.description;       
        }
        else
        {
            var strErrorDesc = GetRuntimeErrorDesc(oErrorObj.name);
            if (strErrorDesc.length != 0)
            {
                var L_strScriptRuntimeError_Text = " 运行脚本时出错:\r\n\r\n";
                strErrorText = oErrorObj.name + L_strScriptRuntimeError_Text + strErrorDesc;
            }
        }

        oWizard.SetErrorInfo(strErrorText, oErrorObj.number & 0xFFFFFFFF);
    }
    catch(e)
    {
        var L_ErrSettingErrInfo_Text = "设置错误信息时出错。";
        oWizard.ReportError(L_ErrSettingErrInfo_Text);
    }
}


/******************************************************************************
         Description: Returns a description for the exception type given
 strRuntimeErrorName: The name of the type of exception occurred
 *****************************************************************************/
function GetRuntimeErrorDesc(strRuntimeErrorName)
{
    var L_strDesc_Text = "";
    switch(strRuntimeErrorName)
    {
        case "ConversionError":
            var L_ConversionError1_Text = "每当尝试将对象转换为";
            var L_ConversionError2_Text = "它无法转换到的内容时，就会发生此错误。";
            L_strDesc_Text = L_ConversionError1_Text + "\r\n" + L_ConversionError2_Text;
            break;
        case "RangeError":
            var L_RangeError1_Text = "如果为函数提供的参数";
            var L_RangeError2_Text = "超出其允许范围，则出现此错误。例如，";
            var L_RangeError3_Text = "如果尝试构造的数组对象的长度不是";
            var L_RangeError4_Text = "有效的正整数，则出现此错误。";
            L_strDesc_Text = L_RangeError1_Text + "\r\n" + L_RangeError2_Text + "\r\n" + L_RangeError3_Text + "\r\n" + L_RangeError4_Text;
            break;
        case "ReferenceError":
            var L_ReferenceError1_Text = "如果检测到无效引用，则出现此错误。";
            var L_ReferenceError2_Text = "例如，如果所需引用为 null，则出现此错误。";
            L_strDesc_Text = L_ReferenceError1_Text + "\r\n" + L_ReferenceError2_Text;
            break;
        case "RegExpError":
            var L_RegExpError1_Text = "如果因正则表达式而在编译时出错，则出现此错误。";
            var L_RegExpError2_Text = "一旦正则表达式通过编译，就不会出现此错误。";
            var L_RegExpError3_Text = "例如，如果声明正则表达式所用的模式中存在以下三种情况，则出现此错误:";
            var L_RegExpError4_Text = "一是无效语法；二是";
            var L_RegExpError5_Text = "除 i、g 或 m 以外的标志；三是多次包含同一标志。";
            L_strDesc_Text = L_RegExpError1_Text + "\r\n" + L_RegExpError2_Text + "\r\n" + L_RegExpError3_Text + "\r\n" + L_RegExpError4_Text + "\r\n" + L_RegExpError5_Text;
            break;
        case "SyntaxError":
            var L_SyntaxError1_Text = "如果对源文本进行分析后发现其语法不正确，则出现此错误。";
            var L_SyntaxError2_Text = "例如，";
            var L_SyntaxError3_Text = "如果调用 Eval 函数时所用参数不是有效的程序文本，则出现此错误。";
            L_strDesc_Text = L_SyntaxError1_Text + "\r\n" + L_SyntaxError2_Text + "\r\n" + L_SyntaxError3_Text;
            break;
        case "TypeError":
            var L_TypeError1_Text = "只要操作数的实际类型与所需类型不匹配，就会出现此错误。";
            var L_TypeError2_Text = "例如，如果某个函数调用";
            var L_TypeError3_Text = "的不是一个对象，或者根本不支持该调用，则出现此错误。";
            L_strDesc_Text = L_TypeError1_Text + "\r\n" + L_TypeError2_Text + "\r\n" + L_TypeError3_Text;
            break;
        case "URIError":
            var L_URIError1_Text = "如果检测到非法的统一资源标识符(URI)，则出现此错误。";
            var L_URIError2_Text = "例如，如果在编码或解码的字符串中发现非法字符，则";
            var L_URIError3_Text = "出现此错误。";
            L_strDesc_Text = L_URIError1_Text + "\r\n" + L_URIError2_Text + "\r\n" + L_URIError3_Text;
            break;
        default:
            break;
    }
    return L_strDesc_Text;
}

/******************************************************************************
 Description: Creates the Templates.inf file.
              Templates.inf is created based on TemplatesInf.txt and contains
              a list of file names to be created by the wizard.
******************************************************************************/
function CreateInfFile()
{
    try
    {
        var oFSO, TemplatesFolder, TemplateFiles, strTemplate;
        oFSO = new ActiveXObject("Scripting.FileSystemObject");

        var TemporaryFolder = 2;
        var oFolder = oFSO.GetSpecialFolder(TemporaryFolder);

        var strTempFolder = oFSO.GetAbsolutePathName(oFolder.Path);
        var strWizTempFile = strTempFolder + "\\" + oFSO.GetTempName();

        var strTemplatePath = wizard.FindSymbol("TEMPLATES_PATH");
        var strInfFile = strTemplatePath + "\\Templates.inf";
        wizard.RenderTemplate(strInfFile, strWizTempFile);

        var oWizTempFile = oFSO.GetFile(strWizTempFile);
        return oWizTempFile;

    }
    catch(e)
    {   
        throw e;
    }
}

/******************************************************************************
 Description: Returns a unique file name
strDirectory: Directory to look for file name in
 strFileName: File name to check.  If unique, same file name is returned.  If 
              not unique, a number from 1-9999999 will be appended.  If not 
              passed in, a unique file name is returned via GetTempName.
******************************************************************************/
function GetUniqueFileName(strDirectory, strFileName)
{
    try
    {
        oFSO = new ActiveXObject("Scripting.FileSystemObject");
        if (!strFileName)
            return oFSO.GetTempName();

        if (strDirectory.length && strDirectory.charAt(strDirectory.length-1) != "\\")
            strDirectory += "\\";

        var strFullPath = strDirectory + strFileName;
        var strName = strFileName.substring(0, strFileName.lastIndexOf("."));
        var strExt = strFileName.substr(strFileName.lastIndexOf("."));

        var nCntr = 0;
        while (oFSO.FileExists(strFullPath))
        {
            nCntr++;
            strFullPath = strDirectory + strName + nCntr + strExt;
        }
        if (nCntr)
            return strName + nCntr + strExt;
        else
            return strFileName;
    }
    catch(e)
    {   
        throw e;
    }
}


/******************************************************************************
 Description: Deletes the file given
        oFSO: File System Object
     strFile: Name of the file to be deleted
******************************************************************************/
function DeleteFile(oFSO, strFile)
{
    try
    {
        if (oFSO.FileExists(strFile))
        {
            var oFile = oFSO.GetFile(strFile);
            oFile.Delete();
        }
    }
    catch(e)
    {   
        throw e;
    }
}

/******************************************************************************
Description: Returns the highest dispid from members of the given interface & 
             all its bases
  oInterface: Interface object
******************************************************************************/
function GetMaxID(oInterface)
{
    var currentMax = 0;
    try
    {
        var funcs = oInterface.Functions;
        if(funcs!=null)
        {
            var nTotal = funcs.Count;
            var nCntr;
            for (nCntr = 1; nCntr <= nTotal; nCntr++)
            {
                var id = funcs(nCntr).Attributes("id");
                if(id!=null)
                {
                    var idval = parseInt(id.Value);
                    if(idval>currentMax)
                        currentMax = idval;
                }
            }
        }
//REMOVE remove this and use Children collection above, if it's implemented
        funcs = oInterface.Variables;
        if(funcs!=null)
        {
            var nTotal = funcs.Count;
            var nCntr;
            for (nCntr = 1; nCntr <= nTotal; nCntr++)
            {
                var id = funcs(nCntr).Attributes("id");
                if(id!=null)
                {
                    var idval = parseInt(id.Value);
                    if(idval>currentMax)
                        currentMax = idval;
                }
            }
        }
        var nextBases = oInterface.Bases;
        var nTotal = nextBases.Count;
        var nCntr;
        for (nCntr = 1; nCntr <= nTotal; nCntr++)
        {
            var nextObject = nextBases(nCntr).Class;
            if(nextObject!=null && nextObject.Name != "IDispatch")
            {
                var idval = GetMaxID(nextObject);
                if(idval>currentMax)
                        currentMax = idval;
            }
        }
        return currentMax;
    }
    catch(e)
    {   
        throw e;
    }
}


/******************************************************************************
 Description: Generates a C++ friendly name
     strName: The old, unfriendly name
******************************************************************************/
function CreateSafeName(strName)
{
    try
    {
        var nLen = strName.length;
        var strSafeName = "";
        
        for (nCntr = 0; nCntr < nLen; nCntr++)
        {
            var cChar = strName.charAt(nCntr);
            if ((cChar >= 'A' && cChar <= 'Z') || (cChar >= 'a' && cChar <= 'z') || 
                    (cChar == '_') || (cChar >= '0' && cChar <= '9'))
            {
                // valid character, so add it
                strSafeName += cChar;
            }
            // otherwize, we skip it
        }
        if (strSafeName=="")
        {
            // if it's empty, we add My
            strSafeName = "My";
        }
        else if (strSafeName.charAt(0) >= '0' && strSafeName.charAt(0) <= '9')
        {
            // if it starts with a digit, we prepend My
            strSafeName = "My" + strSafeName;
        }
        return strSafeName;
    }
    catch(e)
    {   
        throw e;
    }
}


/******************************************************************************
 Description: Called from the wizards html script when 'Finish' is clicked. This
              function in turn calls the wizard control's Finish().
    document: HTML document object
******************************************************************************/
function OnWizFinish(document)
{
    document.body.style.cursor='wait';
    try
    {
        window.external.Finish(document, "ok"); 
    }
    catch(e)
    {
        document.body.style.cursor='default';
        if (e.description.length != 0)
            SetErrorInfo(e.description, e.number);
        return e.number;
    }
}

/******************************************************************************
 Description: Returns a Function object based on the given name
      oClass: Class object
 strFuncName: Name of the function
       oProj: Selected project
******************************************************************************/
function GetMemberFunction(oClass, strFuncName, oProj)
{
    try
    {
        var oFunctions;
        if (oClass)
            oFunctions = oClass.Functions;
        else
        {
            if (!oProj)
                return false;
            oFunctions = oProj.CodeModel.Functions;
        }

        for (var nCntr = 1; nCntr <= oFunctions.Count; nCntr++)
        {
            if (oFunctions(nCntr).Name == strFuncName)
                return oFunctions(nCntr);
        }
        return false;
    }
    catch(e)
    {   
        throw e;
    }
}


/*****************************************************************************
  The following section contains functions that are used by CSharp Projects
  and CSharp Additems. If you like to add a new function that is CSharp
  specific, please add it beyond this point of this file.

                            - CSHARP SECTION -
******************************************************************************/

/******************************************************************************
     Description: Creates a C# project
  strProjectName: Project Name
  strProjectPath: The path that the project will be created in
 strTemplateFile: Project template file e.g. "defualt.csproj"
******************************************************************************/
function CreateCSharpProject(strProjectName, strProjectPath, strTemplateFile)
{
    try
    {
        // Make sure user sees ui.
        dte.SuppressUI = false;
        var strProjTemplatePath = wizard.FindSymbol("PROJECT_TEMPLATE_PATH") + "\\";
        var strProjTemplate = strProjTemplatePath + strTemplateFile; 
        var Solution = dte.Solution;
        var strSolutionName = "";
        if (wizard.FindSymbol("CLOSE_SOLUTION"))
        {
            Solution.Close();
            strSolutionName = wizard.FindSymbol("VS_SOLUTION_NAME");
            if (strSolutionName.length)
            {

                var strSolutionPath = strProjectPath.substr(0, strProjectPath.length - strProjectName.length);
                Solution.Create(strSolutionPath, strSolutionName);
            }
        }

        strProjectNameWithExt = strProjectName + ".csproj";

        var oTarget = wizard.FindSymbol("TARGET");
        var oPrj;
        if (wizard.FindSymbol("WIZARD_TYPE") == vsWizardAddSubProject)  // vsWizardAddSubProject
        {
            var nPos = strProjectPath.search("http://");
            var prjItem
            if(nPos == 0)
                prjItem = oTarget.AddFromTemplate(strProjTemplate, strProjectPath + "/" + strProjectNameWithExt);    
            else
                prjItem = oTarget.AddFromTemplate(strProjTemplate, strProjectPath + "\\" + strProjectNameWithExt);
            oPrj = prjItem.SubProject;
        }
        else
        {
            oPrj = oTarget.AddFromTemplate(strProjTemplate, strProjectPath, strProjectNameWithExt);
        }
        var strNameSpace = "";
        strNameSpace = oPrj.Properties("RootNamespace").Value;
        wizard.AddSymbol("SAFE_NAMESPACE_NAME",  strNameSpace);

        return oPrj;
    }
    catch(e)
    {
        // propagate all errors back to the caller
        throw e;
    }
}

/******************************************************************************
     Description: 
           oProj: Project object
******************************************************************************/
function GetUIReferencesNode(oProj)
{
    var L_strReferencesNode_Text = "引用"; // This string needs to be localized
    try
    {
        var UIItemX = GetUIItem(oProj, L_strReferencesNode_Text);
        return UIItemX.UIHierarchyItems;
    }
    catch(e)
    {
    }
}

/******************************************************************************
     Description: Returns the parent of the input hierarchy item. The parent 
                  may be a folder, or a superproject or the solution.
           oProj: Project object
******************************************************************************/
function getParent(obj)
{
    var parent = obj.Collection.parent;
    //
    // is obj a project ?
    //
    if( parent == dte )
    {
        //
        // is obj a sub-project ?
        //
        if( obj.ParentProjectItem )
        {                
            parent = obj.ParentProjectItem.Collection.parent;
        }
        else
        {
            //
            // obj is a top-level project
            //
            parent = null;
        }
    }
    return parent;    
}

/******************************************************************************
 Description: Gets the UIHierarchyItem for the projectitem, sName. If 
              sName is empty, returns the UIHierarchyItem for the project.
       oProj: Project object
       sName: Project item name
******************************************************************************/
function GetUIItem( oProj, sName )
{
    // this functionality will not work properly for projects nested under
    // solution folders until automation support can be added in M2.

    if( sName != "" )
    {
        sSaveName = sName;
        sName = oProj.Name + "\\" + sSaveName;
    }
    else
    {
        sName = oProj.Name;
    }

    var parent = getParent( oProj );

    while( parent != null )
    {
        sSaveName = sName;
        sName = parent.Name + "\\" + sSaveName;
        parent = getParent( parent );

    }

    //
    // we have arrived at the top of the soltuion explorer hierarchy - return the sName index into the solution's UIHierarchyItem collection
    //
    var strSolutionName = dte.Solution.Properties("Name");
    var vsHierObject = dte.Windows.Item(vsWindowKindSolutionExplorer).Object;   
    return vsHierObject.GetItem( strSolutionName + "\\" + sName );
}

/******************************************************************************
 description: returns true if this path is a root web project
        strProjectPath: path to the web proj
******************************************************************************/
function ProjectIsARootWeb(strProjectPath)
{
    // Returns true if strProjectPath is a root web. Is does this by counting
    // the forward slashes. Web roots are of the form: http://server. Assuming
    // no trailing slash, a web root will have 2 forward slashes, non webroots will
    // have 3 or more slashes. 
    var nCntr = 0;
    var cSlashes = 0;
    var nLen = strProjectPath.length - 1;   // Ignore last character
    for (nCntr = 0; nCntr < nLen; nCntr++)
    {
        // Count the forward slashes
        if(strProjectPath.charAt(nCntr) == "/")
            cSlashes++;
    }
    
    if(cSlashes == 2)
        return true;
    return false;
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function IsReferencesNodeExpanded(oProj)
{
    UIItem = GetUIReferencesNode(oProj);
    try
    {
        if (UIItem.Expanded == true)
            return true;
    }
    catch(e)
    {
    }
    
    return false;
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function CollapseReferencesNode(oProj)
{
    UIItem = GetUIReferencesNode(oProj);
    try
    {
        UIItem.Expanded = false;
    }
    catch(e)
    {
    }
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function GetCSharpReferenceManager(oProj)
{
    var VSProject = oProj.Object;
    var refmanager = VSProject.References;
    return refmanager;
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForClass(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Data");
    refmanager.Add("System.XML");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForComponent(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForInstaller(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Management");
    refmanager.Add("System.Configuration.Install");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForControl(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Data");
    refmanager.Add("System.Drawing");
    refmanager.Add("System.Windows.Forms");
    refmanager.Add("System.XML");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForWinForm(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Data");
    refmanager.Add("System.Drawing");
    refmanager.Add("System.Windows.Forms");
    refmanager.Add("System.XML");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForWinService(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Data");
    refmanager.Add("System.ServiceProcess");
    refmanager.Add("System.XML");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForWebService(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Data");
    refmanager.Add("System.Web");
    refmanager.Add("System.Web.Services");
    refmanager.Add("System.XML");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForWebForm(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Drawing");
    refmanager.Add("System.Data");
    refmanager.Add("System.Web");
    refmanager.Add("System.XML");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
******************************************************************************/
function AddReferencesForWebControl(oProj)
{
    var refmanager = GetCSharpReferenceManager(oProj);
    refmanager.Add("System");
    refmanager.Add("System.Drawing");
    refmanager.Add("System.Web");
    CollapseReferencesNode(oProj);
}

/******************************************************************************
 Description: 
       oProj: Project object
    itemName:
******************************************************************************/
function SetStartupPage(oProj, itemName)
{
    var configs = new Enumerator(oProj.ConfigurationManager);
    for(;!configs.atEnd();configs.moveNext())
    {
        configs.item().Properties("StartPage").Value = itemName;
    }
}

/******************************************************************************
    Description: Adds all the files to the project based on the Templates.inf file.
          oProj: Project object
 strProjectName: Project name
 strProjectPath: Project path
        InfFile: Templates.inf file object
    AddItemFile: Wether the wizard is invoked from the Add Item Dialog or not
******************************************************************************/
function AddFilesToCSharpProject(oProj, strProjectName, strProjectPath, InfFile, AddItemFile)
{
    try
    {
        dte.SuppressUI = false;
        var projItems;
        if(AddItemFile)
            projItems = oProj;
        else
            projItems = oProj.ProjectItems;

        var strTemplatePath = wizard.FindSymbol("TEMPLATES_PATH");

        var strTpl = "";
        var strName = "";
        var strDependent = "";

        // if( Not a web project )
        if(strProjectPath.charAt(strProjectPath.length - 1) != "\\")
            strProjectPath += "\\"; 

        var strTextStream = InfFile.OpenAsTextStream(1, -2);
        
        while (!strTextStream.AtEndOfStream)
        {
            // Look to see if there is a dependency on another object.  The inf
            // file will show as:
            //
            // MasterObjectFileName;DependentObjectFileName
            strTpl = strTextStream.ReadLine();
            if (strTpl != "")
            {
                var sc = strTpl.indexOf(";");
                if (sc >= 0) 
                {
                    strName = strTpl.substr(0,sc);
                    if(sc < strTpl.length)
                    {
                        strDependent = strTpl.substr(sc+1);
                    }
                    else 
                    {
                        strDependent = "";
                    }
                }
                else
                {
                    strName = strTpl;
                    strDependent = "";
                }

                var strTarget = "";
                var strFile = "";
                strTarget = GetCSharpTargetName(strName, strProjectName);

                var fso;
                fso = new ActiveXObject("Scripting.FileSystemObject");
                var TemporaryFolder = 2;
                var tfolder = fso.GetSpecialFolder(TemporaryFolder);
                var strTempFolder = fso.GetAbsolutePathName(tfolder.Path);

                var strFile = strTempFolder + "\\" + fso.GetTempName();

                var strClassName = strTarget.split(".");
                wizard.AddSymbol("SAFE_CLASS_NAME", strClassName[0]);
                    wizard.AddSymbol("SAFE_ITEM_NAME", strClassName[0]);

                var strTemplate = strTemplatePath + "\\" + strName;
                var bCopyOnly = false;
                var strExt = strName.substr(strName.lastIndexOf("."));
                if(strExt==".bmp" || strExt==".ico" || strExt==".gif" || strExt==".rtf" || strExt==".css")
                    bCopyOnly = true;
                wizard.RenderTemplate(strTemplate, strFile, bCopyOnly, true);

                var projfile = projItems.AddFromTemplate(strFile, strTarget);
                SafeDeleteFile(fso, strFile);
                
                if(projfile)
                {
                    SetFileProperties(projfile, strName);
                    if (strDependent != "") 
                    {
                        // There is a dependent file.  Add this to the projfile we just added
                        var strDependentTarget = GetCSharpTargetName(strDependent, strProjectName);
                        
                        strTemplate = strTemplatePath + "\\" + strDependent;
                        strFile = strTempFolder + "\\" + fso.GetTempName();
                        strExt = strDependent.substr(strDependent.lastIndexOf("."));
                        if(strExt==".bmp" || strExt==".ico" || strExt==".gif" || strExt==".rtf" || strExt==".css")
                            bCopyOnly = true;
                        else
                            bCopyOnly = false;
                        wizard.RenderTemplate(strTemplate, strFile, bCopyOnly, true);
                        
                        var dependentItem = projfile.ProjectItems.AddFromTemplate(strFile, strDependentTarget);
                        SafeDeleteFile(fso, strFile);
                    }
                }

                var bOpen = false;
                if(AddItemFile)
                    bOpen = true;
                else if (DoOpenFile(strTarget))
                    bOpen = true;

                if(bOpen)
                {
                    var window = projfile.Open(vsViewKindPrimary);
                    window.visible = true;
                }
            }
        }
        strTextStream.Close();
    }
    catch(e)
    {
        strTextStream.Close();
        throw e;
    }
}

/******************************************************************************
    Description: Adds a designer file to the project.
          oProj: Project object
 strProjectName: Project name
 strProjectPath: Project path
strDesignerFile: Designer file name
    AddItemFile: Wether the wizard is invoked from the Add Item Dialog or not
******************************************************************************/
function AddDesignerFileToCSharpWebProject(oProj, strProjectName, strProjectPath, strDesignerFile, AddItemFile)
{
    dte.SuppressUI = false;
    var projItems;
    if(AddItemFile)
        projItems = oProj;
    else
        projItems = oProj.ProjectItems;

    var strTemplatePath = wizard.FindSymbol("TEMPLATES_PATH");

    var strTpl = "";
    var strName = "";

    if (strDesignerFile != "")
    {
        strName = strDesignerFile;
        var strTarget;
        if(!AddItemFile)
        {
            strTarget = GetCSharpTargetName(strName, strProjectName);
        }
        else
        {
            strTarget = wizard.FindSymbol("ITEM_NAME");
        }
        var strClassName = strTarget.split(".");
        wizard.AddSymbol("SAFE_CLASS_NAME", strClassName[0]);
        wizard.AddSymbol("SAFE_ITEM_NAME", strClassName[0]);

        var strTemplate = strTemplatePath + "\\" + strDesignerFile;
        var projfile = projItems.AddFromTemplate(strTemplate, strTarget);
        if(projfile)
            SetFileProperties(projfile, strName);

        var bOpen = false;
        if(AddItemFile)
            bOpen = true;
        else if (DoOpenFile(strTarget))
            bOpen = true;

        if(bOpen)
        {
            var window = projfile.Open(vsViewKindPrimary);
            if(window)
                window.visible = true;
        }
    }
}

/******************************************************************************
 Description: Validate the value of the wizard combo control as a CSharp type.
     oObject: The wizard editable combo control
******************************************************************************/
function ValidateWizComboCSharpType(oObject, strName)
{
    var bValid;
    if(typeof(strName) == "undefined")
        strName = oObject.id;
    if (oObject.ListIndex > -1)
    {
        bValid = true;
    }
    else if(""==oObject.value)
    {
        L_ValidateCSharpTypeEEmpty_Text = " 不能为空。";
        window.external.ReportError(strName + L_ValidateCSharpTypeEEmpty_Text);
        bValid = false;
    }
    else if ( !window.external.ValidateCLRIdentifier(oObject.value) )
    {
        L_ValidateCSharpType_E_INVALID_TEXT = "无效";
        L_PERIOD_TEXT = ".";
        window.external.ReportError(L_ValidateCSharpType_E_INVALID_TEXT + strName + L_PERIOD_TEXT); 
        bValid = false;
    }
    else
        bValid = true;
    return bValid;
}

/******************************************************************************
 Description: Validate the value of the control as a valid CSharp name.
     oObject: The reference to control
     strName: Control name used by message
******************************************************************************/
function ValidateCSharpName(oObject, strName)
{
    var bValid;
    if(typeof(strName) == "undefined")
        strName = oObject.id;

    if(""==oObject.value)
    {
        L_ValidateCSharpNameEEmpty_Text = " 不能为空。";
        window.external.ReportError(strName + L_ValidateCSharpNameEEmpty_Text);
        bValid = false;
    }
    else if ( !window.external.ValidateCLRIdentifier(oObject.value) )
    {
        L_ValidateCSharpName_E_INVALID_TEXT = "无效";
        L_PERIOD_TEXT = ".";
        window.external.ReportError(L_ValidateCSharpName_E_INVALID_TEXT + strName + L_PERIOD_TEXT); 
        bValid = false;
    }
    else
        bValid = true;
    return bValid;
}

/******************************************************************************
 Description: Gets the current selected project items from the selection 
                 object if it was passed from Solution Explorer.
     oObject: The wizard context object
******************************************************************************/
function SetTargetFullPath(oObject)
{
    var parent = oObject.Parent;
    var kind = parent.Kind;
    var strFilePath = "";
    var strNameSpace = "";
    if(kind == GUID_ItemType_PhysicalFolder || kind == GUID_ItemType_VirtualFolder)
    {
        strFilePath = parent.FileNames(1);
        strNameSpace = parent.Properties("DefaultNamespace").Value;
    }
    else
    {
        strFilePath =   wizard.FindSymbol("PROJECT_PATH");
        strNameSpace = parent.Properties("RootNamespace").Value;
    }
    wizard.AddSymbol("SAFE_NAMESPACE_NAME",  strNameSpace);
    wizard.AddSymbol("TARGET_FULLPATH",  strFilePath);
}

/******************************************************************************
 Description: Strip spaces from a string
       strin: The string (is in/out param)
******************************************************************************/
function TrimStr(str)
{
    var nLength = str.length;
    var nStartIndex = 0;
    var nEndIndex = nLength-1;

    while (nStartIndex < nLength && (str.charAt(nStartIndex) == ' ' || str.charAt(nStartIndex) == '\t'))
        nStartIndex++;
        
    while (nEndIndex > nStartIndex && (str.charAt(nEndIndex) == ' ' || str.charAt(nEndIndex) == '\t'))
        nEndIndex--;
    
    return str.substring(nStartIndex, nEndIndex+1);
}

/******************************************************************************
 Description: Open the file that contains the TextPoint, then move the cursor to the 
              TextPoint.
         oTP: The reference to TextPoint
******************************************************************************/
function ShowTextPoint(oTP)
{
    try
    {
        oTP.Parent.Parent.ProjectItem.Open(vsViewKindCode).Visible = true;
        var oSel = oTP.Parent.Selection;
        oSel.MoveToPoint(oTP);
        oSel.ActivePoint.TryToShow(vsPaneShowHow.vsPaneShowAsIs);
    }
    catch(e)
    {
        throw(e);
    }
}

/******************************************************************************
 Description: Add the default target schema. 
         
******************************************************************************/
function AddDefaultTargetSchemaToWizard(selProj)
{
    var prjTargetSchema = selProj.Properties("DefaultTargetSchema").Value;
    // 0 = IE3/Nav4
    // 1 = IE5
    // 2 = Nav4
    if(prjTargetSchema == 0)
    {
        wizard.AddSymbol("DEFAULT_TARGET_SCHEMA", "http://schemas.microsoft.com/intellisense/ie3-2nav3-0");
    }
    else if( prjTargetSchema == 2)
    {
        wizard.AddSymbol("DEFAULT_TARGET_SCHEMA", "http://schemas.microsoft.com/intellisense/nav4-0");
    }
    else
    {
        wizard.AddSymbol("DEFAULT_TARGET_SCHEMA", "http://schemas.microsoft.com/intellisense/ie5");
    }
}

/******************************************************************************
 Description: Delete file using file system object. 
******************************************************************************/
function SafeDeleteFile( fso, strFilespec )
{
    if (fso.FileExists(strFilespec))
    {
        var tmpFile = fso.GetFile(strFilespec);
        tmpFile.Delete();
    }
}

// SIG // Begin signature block
// SIG // MIIoNwYJKoZIhvcNAQcCoIIoKDCCKCQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // YcrDcBVoI4jKptX6j/F4a4UMSZmEdsuWXyKNfHw93Dqg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAABAO91ZVdDzsYrQAA
// SIG // AAAEAzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExM1oX
// SIG // DTI1MDkxMTIwMTExM1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n3RnXcCDp20WFMoNNzt4s9fV12T5roRJlv+bshDfvJoM
// SIG // ZfhyRnixgUfGAbrRlS1St/EcXFXD2MhRkF3CnMYIoeMO
// SIG // MuMyYtxr2sC2B5bDRMUMM/r9I4GP2nowUthCWKFIS1RP
// SIG // lM0YoVfKKMaH7bJii29sW+waBUulAKN2c+Gn5znaiOxR
// SIG // qIu4OL8f9DCHYpME5+Teek3SL95sH5GQhZq7CqTdM0fB
// SIG // w/FmLLx98SpBu7v8XapoTz6jJpyNozhcP/59mi/Fu4tT
// SIG // 2rI2vD50Vx/0GlR9DNZ2py/iyPU7DG/3p1n1zluuRp3u
// SIG // XKjDfVKH7xDbXcMBJid22a3CPbuC2QJLowIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFOpuKgJKc+OuNYitoqxfHlrE
// SIG // gXAZMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis1MDI5MjYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBRaP+hOC1+dSKhbqCr1LIvNEMrRiOQ
// SIG // EkPc7D6QWtM+/IbrYiXesNeeCZHCMf3+6xASuDYQ+AyB
// SIG // TX0YlXSOxGnBLOzgEukBxezbfnhUTTk7YB2/TxMUcuBC
// SIG // P45zMM0CVTaJE8btloB6/3wbFrOhvQHCILx41jTd6kUq
// SIG // 4bIBHah3NG0Q1H/FCCwHRGTjAbyiwq5n/pCTxLz5XYCu
// SIG // 4RTvy/ZJnFXuuwZynowyju90muegCToTOwpHgE6yRcTv
// SIG // Ri16LKCr68Ab8p8QINfFvqWoEwJCXn853rlkpp4k7qzw
// SIG // lBNiZ71uw2pbzjQzrRtNbCFQAfmoTtsHFD2tmZvQIg1Q
// SIG // VkzM/V1KCjHL54ItqKm7Ay4WyvqWK0VIEaTbdMtbMWbF
// SIG // zq2hkRfJTNnFr7RJFeVC/k0DNaab+bpwx5FvCUvkJ3z2
// SIG // wfHWVUckZjEOGmP7cecefrF+rHpif/xW4nJUjMUiPsyD
// SIG // btY2Hq3VMLgovj+qe0pkJgpYQzPukPm7RNhbabFNFvq+
// SIG // kXWBX/z/pyuo9qLZfTb697Vi7vll5s/DBjPtfMpyfpWG
// SIG // 0phVnAI+0mM4gH09LCMJUERZMgu9bbCGVIQR7cT5YhlL
// SIG // t+tpSDtC6XtAzq4PJbKZxFjpB5wk+SRJ1gm87olbfEV9
// SIG // SFdO7iL3jWbjgVi1Qs1iYxBmvh4WhLWr48uouzCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghoKMIIaBgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAfX+dK8BFCKjIH
// SIG // PS+MsA1F71djZ3J/1ju78cb/4b8Y/zBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAAOefoY7D81AD8x2WGJdkBC/MP9XOXGe
// SIG // yZugOw336J7MvbYgj9O13yvklEsNFb9W+Nq6B2rrrFYG
// SIG // gmN9zfqvP0LG9+pAzmbnUnFb/Y006pFmzukPKkYxCvMZ
// SIG // Fy9cKARVnbWAY+76MXHB6rQaDJKz2GO/MWz0t7DEFzkN
// SIG // nRuCrMyvlxW7DllfBSP6Bgm/KkjMHiCueFc8OPyXC+Yo
// SIG // CL0KiKXXyqWBy76omyRsR5Ojm1O3sSxmBQ3JPWGdJOro
// SIG // APNEr2yCS/wZDHwEA+plVFksEu0Wk0mnDOO3DLBLlDZW
// SIG // jutedbXgfZevorYyxqSGLY2idmL85c2B4pCNt2gi059s
// SIG // yhWhgheUMIIXkAYKKwYBBAGCNwMDATGCF4Awghd8Bgkq
// SIG // hkiG9w0BBwKgghdtMIIXaQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // TEbQ/mpeNiok7QhBTqdvMUCQ/XpefZgqyjoX8mNQpaoC
// SIG // BmdbDchEyhgTMjAyNTAxMTYxODE0NTEuMjM0WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjMzMDMt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR6jCCByAwggUIoAMCAQIC
// SIG // EzMAAAHm2UKe6gD4feEAAQAAAeYwDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTE1WhcNMjUwMzA1MTg0NTE1WjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOjMzMDMtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAvb6YfOLYJbhM5v8KTSpQI3BJRs35bygA2dQ/tnf4
// SIG // nmGBLRdhyjKyhhQzi6S1lhuQxMoim5WCqxNp7eeNDhrt
// SIG // +WcdIFyQRNM1mp2RAIwo7eHhgYvrmpGbJO9Mx00Bx8nz
// SIG // /gd5tgUkjRT4YLFSD6er6P/bejnjXsyMF+ROflcBBt+5
// SIG // 2YBHsUBdn0GWG8UNQGrqg70XV7EqStXYdVAbfRGjLM7r
// SIG // nGkeZzMEDerA4xvfRc3SvQLc25+EppbKC1LUQIf++vLC
// SIG // ndGNYTJilR8CF/P+CblEVAUWdCVrtDWEAafJIZLtfEPA
// SIG // gEOdNLRQe1R96Q/M6AOJXAOyZMUxqDyq7n5vpUWQAOIj
// SIG // IG3C2dj/8UnZyhcVPLy99UaDZWSYhi+TKk1778gS8/jE
// SIG // T+BJ/TcntTfMf5SQ9bLXTaOcCRvpoF7BP8384NhmlakH
// SIG // MxR4NDZfG6SKpzRVEXkEatwtY1WDAknHoDcx3mLcOTpm
// SIG // f+3lZ0Zo15QrC73bMTs3NWFZ+p2S5EA+ct9R2KwfYiB7
// SIG // rMIWjL9oSTTY1Z3ZKVsvd+DyGblkzJN+tJI1zxcJdlr9
// SIG // U85vbTqwqvPpeNPCiC+ifnn6BjZEfGAdzPrtbWHlQzv0
// SIG // 3Dmxh8WhhQekGcQFKZ3weTfzJgTcTDqsxtTfEIsFvILY
// SIG // 4zCYhQX+omGKwo7UcBeyD3UCxbUCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBTlBDF57TeePtdWTPkLu0Oa4NxXPTAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAYW7qIE2qUbLsEpGhTEOncrvG
// SIG // QmFKVkPIiK24uNLVNoSuqR4LtIY9M//cxUUceQ34bpI7
// SIG // 24wP3UuVWH8c9RCGz5bfPezCdrARjtmC2MGHpXyaQ8Gw
// SIG // dF0vWZK6qc6ul/5Zg0A59xub3GKWEAieeSy78hZSdfeQ
// SIG // FaOFsvFF+ae4PVtzIDR0DKTPhFeuPnLM4+B6OWkJnihr
// SIG // Ssu8O9nkWP71g7qba7867hTZigiLddlHAOQTrF6dT7ZI
// SIG // 8dskbAo++w0ppdM1WI6lvyElpKxo8nlSfpIc3LcWi5JJ
// SIG // VcAsYoKJA+n5Fm8tIQhCkzkzzM4boDyAHMXB7EdrMdNW
// SIG // EWvaR9s73XbLgRH0hRugo9EErxGfzPZifoeJomkEkewB
// SIG // G1Rg28kSpGJ/NEvtwJkZYd2TnvgRaieezl3XiA0h27x8
// SIG // ye6E6hvPepd3lIT7GYOvXzYMU8Zb0TZkRP/utWI+2dbg
// SIG // dF2ED+tK7DC3U5VWBMmVJeTC0y+S76haM2ZUtl6I4uAR
// SIG // D+nXVU85hyeKHTmTFk03kNCMJ1hvfL1r/66D3oAq9Rut
// SIG // RVa3VyxNwFyH7eGTeGZA056AIT8Ow2TT0ZUluE21Y/y8
// SIG // NF75y2DcDFAPaLmP8MfbXk2ifL05G4GMmjmChc+qzUV2
// SIG // eGn+ntyF8DAn3wmrKSlFwu9mDLuVvC/88k8bDVBIAW0w
// SIG // ggdxMIIFWaADAgECAhMzAAAAFcXna54Cm0mZAAAAAAAV
// SIG // MA0GCSqGSIb3DQEBCwUAMIGIMQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQgUm9vdCBDZXJ0
// SIG // aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAeFw0yMTA5MzAx
// SIG // ODIyMjVaFw0zMDA5MzAxODMyMjVaMHwxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFBDQSAyMDEwMIICIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAg8AMIICCgKCAgEA5OGmTOe0ciELeaLL1yR5vQ7V
// SIG // gtP97pwHB9KpbE51yMo1V/YBf2xK4OK9uT4XYDP/XE/H
// SIG // ZveVU3Fa4n5KWv64NmeFRiMMtY0Tz3cywBAY6GB9alKD
// SIG // RLemjkZrBxTzxXb1hlDcwUTIcVxRMTegCjhuje3XD9gm
// SIG // U3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7uhp7M62AW36M
// SIG // EBydUv626GIl3GoPz130/o5Tz9bshVZN7928jaTjkY+y
// SIG // OSxRnOlwaQ3KNi1wjjHINSi947SHJMPgyY9+tVSP3PoF
// SIG // VZhtaDuaRr3tpK56KTesy+uDRedGbsoy1cCGMFxPLOJi
// SIG // ss254o2I5JasAUq7vnGpF1tnYN74kpEeHT39IM9zfUGa
// SIG // RnXNxF803RKJ1v2lIH1+/NmeRd+2ci/bfV+Autuqfjbs
// SIG // Nkz2K26oElHovwUDo9Fzpk03dJQcNIIP8BDyt0cY7afo
// SIG // mXw/TNuvXsLz1dhzPUNOwTM5TI4CvEJoLhDqhFFG4tG9
// SIG // ahhaYQFzymeiXtcodgLiMxhy16cg8ML6EgrXY28MyTZk
// SIG // i1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1GIRH29wb0f2y
// SIG // 1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N+VLEhReTwDwV
// SIG // 2xo3xwgVGD94q0W29R6HXtqPnhZyacaue7e3PmriLq0C
// SIG // AwEAAaOCAd0wggHZMBIGCSsGAQQBgjcVAQQFAgMBAAEw
// SIG // IwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+gpE8RjUpzxD/
// SIG // LwTuMB0GA1UdDgQWBBSfpxVdAF5iXYP05dJlpxtTNRnp
// SIG // cjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdMg30BATBBMD8G
// SIG // CCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL0RvY3MvUmVwb3NpdG9yeS5odG0wEwYD
// SIG // VR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9
// SIG // lJBb186aGMQwVgYDVR0fBE8wTTBLoEmgR4ZFaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoG
// SIG // CCsGAQUFBwEBBE4wTDBKBggrBgEFBQcwAoY+aHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNS
// SIG // b29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwDQYJKoZIhvcN
// SIG // AQELBQADggIBAJ1VffwqreEsH2cBMSRb4Z5yS/ypb+pc
// SIG // FLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRsfNB1OW27DzHk
// SIG // wo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2LpypglYAA7AF
// SIG // vonoaeC6Ce5732pvvinLbtg/SHUB2RjebYIM9W0jVOR4
// SIG // U3UkV7ndn/OOPcbzaN9l9qRWqveVtihVJ9AkvUCgvxm2
// SIG // EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8DJ6LGYnn8Atq
// SIG // gcKBGUIZUnWKNsIdw2FzLixre24/LAl4FOmRsqlb30mj
// SIG // dAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2kQH2zsZ0/fZM
// SIG // cm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0SCyxTkctwRQE
// SIG // cb9k+SS+c23Kjgm9swFXSVRk2XPXfx5bRAGOWhmRaw2f
// SIG // pCjcZxkoJLo4S5pu+yFUa2pFEUep8beuyOiJXk+d0tBM
// SIG // drVXVAmxaQFEfnyhYWxz/gq77EFmPWn9y8FBSX5+k77L
// SIG // +DvktxW/tM4+pTFRhLy/AsGConsXHRWJjXD+57XQKBqJ
// SIG // C4822rpM+Zv/Cuk0+CQ1ZyvgDbjmjJnW4SLq8CdCPSWU
// SIG // 5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ8cirOoo6CGJ/
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDTTCC
// SIG // AjUCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // TjozMzAzLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUA4ljQXhSfY72hKzeuA9RvOni9JruggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOszroswIhgPMjAyNTAxMTYxNjEy
// SIG // NTlaGA8yMDI1MDExNzE2MTI1OVowdDA6BgorBgEEAYRZ
// SIG // CgQBMSwwKjAKAgUA6zOuiwIBADAHAgEAAgIPszAHAgEA
// SIG // AgISjTAKAgUA6zUACwIBADA2BgorBgEEAYRZCgQCMSgw
// SIG // JjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIB
// SIG // AAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQAaczPsENVT
// SIG // Nat8EAJgRlboccWk1jFG4fz0B1AsEr7Jl+647wAG/5Ft
// SIG // Ywx482GbqfyVPCtgf0ItHEeRAsR7d5ODpdmXYr5LJOzw
// SIG // 9JUn2z56rcZqJeeQw/bIGl/tD787J0Q1XRe8Bu66Nlt4
// SIG // dUMJ+Hi1viLQ3vU9IQBqpAPCJ92D0V+8lfL4fMlLRljq
// SIG // QroS528hn39AdwbLYZMPgPogQHUjpkxa/oLp9KWaacF9
// SIG // 21rgq7OOqHPCbRXcTZrPsd7Hod3si0Nyky/2oQMNHfq6
// SIG // xY9ft2KsaZVokBThD058/ZKUYlvHWFiejCnv+/s+zNRp
// SIG // +cwXsWalK2d+GaI0K4SMq5S+MYIEDTCCBAkCAQEwgZMw
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHm
// SIG // 2UKe6gD4feEAAQAAAeYwDQYJYIZIAWUDBAIBBQCgggFK
// SIG // MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkq
// SIG // hkiG9w0BCQQxIgQgojQ4EruFALIqKW2mUaNoOC3IKaC3
// SIG // hgZn/lK6EPoaKEYwgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCDPu6OGqB6zCWhvIJyztateoSGHEZ6MuhZz
// SIG // gm50g9LGWTCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAAB5tlCnuoA+H3hAAEAAAHmMCIE
// SIG // ID7k5iIzOfdl8xtHurjy9/LqjiKvYisG1deRDJ97qXAh
// SIG // MA0GCSqGSIb3DQEBCwUABIICAJzfQJKo9OtENFxEEREv
// SIG // ytE3Cc6borj6f8GCINo4WAe2GHwUMbTsCCqg/hG9gY+0
// SIG // 6uI1w+Gf8/JHEv6RV3X43tyhRUPzsYh14LP8gZKAIEoG
// SIG // qZ8zHMeXy5Tuim6gqAWlwl7AXDDsLr50CA/djU4xubYi
// SIG // kyRyTw9O8qrPNFre8lPmUP7it/Q0Xpmugij3TaA4x3r8
// SIG // B2fSJVQRLZTGhDRTJJIML/t3RyNeJR1zlX+2qsPmc+BV
// SIG // zLTf60EZxEoHrAeolRzqg//EJuw2TtqGbgW2qYxgiLrp
// SIG // WuLiYgQEfQPrtX8W5gX63GZy7eOPq/Q6u8MNbKx/nYKo
// SIG // wm6sf+GrxDsnFCcdeXJOvkucj1M0RJZsI0aubQT/l5CH
// SIG // BLpoZnQdS91TpelOfy3EPA85bL51p+fxxDW7pYr/T7td
// SIG // oTNI8ZtQmEbY4WhTN8S/u9A/5KwHJa0tI4nSCasA1pnS
// SIG // fA23COv0JWKrGvof2ZxttVsk5+8Rrh+/zyBfeu6kKDMg
// SIG // dtrmHi+6xd7U7tVpA1+Sbo6yytt1tR5Qk9aKSozynAVx
// SIG // B/W/QnMdN3VSH2wuYQ1sPhh+gQJHG14IAk6GxYqXaxrA
// SIG // 5I+vlS3Szp7HqSdboZ08u2KDIDPmANoviPOUJ2wjxZy3
// SIG // HeqrSThf8kkicldvteXBDnzE+1uKlBBBlr8r058ppWaR
// SIG // 2Pd9
// SIG // End signature block
