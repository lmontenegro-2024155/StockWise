using System;
using System.IO;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AuthService.Api.Models;

public sealed class FormFileAdapter : IFileData
{
    private readonly IFormFile _formFile;
    private byte[]? _data;

    public FormFileAdapter(IFormFile formFile)
    {
        ArgumentNullException.ThrowIfNull(formFile);
        _formFile = formFile;
    }

    public byte[] Data
    {
        get
        {
            if (_data is not null)
                return _data;

            using var memoryStream = new MemoryStream((int)_formFile.Length);
            _formFile.CopyTo(memoryStream);
            _data = memoryStream.ToArray();

            return _data;
        }
    }

    public string ContentType => _formFile.ContentType ?? string.Empty;

    public string FileName => _formFile.FileName ?? string.Empty;

    public long Size => _formFile.Length;
}
