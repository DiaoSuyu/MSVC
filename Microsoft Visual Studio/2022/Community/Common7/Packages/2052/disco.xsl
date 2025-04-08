<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:disco="http://schemas.xmlsoap.org/disco/" xmlns:scl="http://schemas.xmlsoap.org/disco/scl/" xmlns:schema="http://schemas.xmlsoap.org/disco/schema" xmlns:xsd="http://www.w3.org/2001/XMLSchema/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance/" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:s="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="disco scl ms s xsi xsd">
	<xsl:output method="html"/>
	<xsl:template match="/">
		<h1 class="listpage" _locID="L_string01_Text">发现页</h1>
		<p class="listpage" _locID="L_string02_Text">此发现文档表示
			一组可以在一起使用的 Web 服务(例如 service.wsdl)、
			数据集(例如 dataset.xsd)以及其他发现文档(例如 group.disco)。</p>
		<h3 _locID="L_string03_Text">Web 服务组内容: </h3>
		<table class="listpage" borderColor="#ffffff" cellSpacing="0" cellPadding="0" rules="rows" width="100%" align="center" frame="void">
			<xsl:choose>
				<xsl:when test="disco:discovery/scl:contractRef">
			        <tr valign="center" align="left">
				        <td class="tbltext">
					        <table borderColor="#ffffff" cellSpacing="0" cellPadding="3" rules="rows" width="100%" border="1" frame="void">
        						<tr>
		        					<td class="header" _locID="L_string04_Text">服务</td>
		        			    </tr>
					            <xsl:for-each select="disco:discovery/scl:contractRef">
                					<xsl:sort select="@ref"/>
						            <tr vAlign="center">
							            <td class="tbltext">
							                <xsl:value-of select="@ref"/><br/>
							                    <a _locID="L_string05_Text"><xsl:call-template name="writeHrefAttrib"> <xsl:with-param name="url" select="@ref"/></xsl:call-template>查看服务</a>
									             <a _locID="L_string06_Text"><xsl:call-template name="writeHrefAttrib"> <xsl:with-param name="url" select="@docRef"/></xsl:call-template>查看文档</a>
									    </td>
									</tr>
    				            </xsl:for-each>
    				        </table>
				        </td>
			        </tr>
					<tr>
						<td class="spacer" bgColor="white" height="5"> </td>
					</tr>
				</xsl:when>
			</xsl:choose>
			<xsl:choose>
				<xsl:when test="disco:discovery/schema:schemaRef">
					<tr valign="center" align="left">
						<td class="tbltext">
					        <table borderColor="#ffffff" cellSpacing="0" cellPadding="3" rules="rows" width="100%" border="1" frame="void">
								<tr>
									<td class="header" _locID="L_string07_Text">数据集</td>
								</tr>
            					<xsl:for-each select="disco:discovery/schema:schemaRef">
                					<xsl:sort select="@ref"/>
			        			    <tr valign="center">
					        		    <td class="tbltext"><xsl:value-of select="@ref"/><br/><a _locID="L_string08_Text"><xsl:call-template name="writeHrefAttrib"> <xsl:with-param name="url" select="@ref"/></xsl:call-template><BR/>查看架构</a>
									    </td>
								    </tr>
            					    </xsl:for-each>
    				        </table>
				        </td>
			        </tr>
					<tr>
						<td class="spacer" bgColor="white" height="5"> </td>
					</tr>
				</xsl:when>
			</xsl:choose>
			<xsl:choose>
				<xsl:when test="disco:discovery/disco:discoveryRef">
					<tr valign="center" align="left">
						<td class="tbltext">
					        <table borderColor="#ffffff" cellSpacing="0" cellPadding="3" rules="rows" width="100%" border="1" frame="void">
								<tr>
									<td class="header" _locID="L_string09_Text">发现文档</td>
								</tr>
            					<xsl:for-each select="disco:discovery/disco:discoveryRef">
                					<xsl:sort select="@ref"/>
			        			    <tr valign="center">
					        		    <td class="tbltext"><xsl:value-of select="@ref"/><br/><a _locID="L_string10_Text"><xsl:call-template name="writeHrefAttrib"> <xsl:with-param name="url" select="@ref"/></xsl:call-template><BR/>查看发现文档</a>
									    </td>
								    </tr>
            					    </xsl:for-each>
    				        </table>
				        </td>
			        </tr>
					<tr>
						<td class="spacer" bgColor="white" height="5"> </td>
					</tr>
				</xsl:when>
			</xsl:choose>
			<xsl:choose>
				<xsl:when test="disco:discovery/scl:contractRef | disco:discovery/schema:schemaRef | disco:discovery/disco:discoveryRef"></xsl:when>
				<xsl:otherwise>
					<tr valign="center">
						<td class="tbltext" _locID="L_string11_Text">此发现文档未定义 Web 引用。</td>
					</tr>
				</xsl:otherwise>
			</xsl:choose>
		</table>
	</xsl:template>
	
	<xsl:template name="writeHrefAttrib">
	    <xsl:param name="url"/>
	    <xsl:variable name="urllower" select="normalize-space(translate($url,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'))"/>
            <xsl:choose>
                <xsl:when test="starts-with($urllower,'http:') or starts-with($urllower,'https:') or starts-with($urllower,'ftp:')">
                    <xsl:attribute name="href">
                        <xsl:value-of select="$url"/>
                    </xsl:attribute>
                </xsl:when>
            </xsl:choose>
	</xsl:template>
</xsl:stylesheet>
