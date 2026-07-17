using System;
using System.Threading.Tasks;
using AuthService.Api.Models;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace AuthService.Api.ModelBinders;

public sealed class FileDataModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        ArgumentNullException.ThrowIfNull(bindingContext);

        // Verificar que el tipo implemente IFileData
        if (!typeof(IFileData).IsAssignableFrom(bindingContext.ModelType))
        {
            return Task.CompletedTask;
        }

        var request = bindingContext.HttpContext.Request;

        // Asegurarse de que la request tenga formulario
        if (!request.HasFormContentType)
        {
            bindingContext.Result = ModelBindingResult.Success(null);
            return Task.CompletedTask;
        }

        var form = request.Form;

        var file = form.Files.GetFile(bindingContext.FieldName);

        if (file is { Length: > 0 })
        {
            var fileData = new FormFileAdapter(file);
            bindingContext.Result = ModelBindingResult.Success(fileData);
        }
        else
        {
            bindingContext.Result = ModelBindingResult.Success(null);
        }

        return Task.CompletedTask;
    }
}

public sealed class FileDataModelBinderProvider : IModelBinderProvider
{
    private static readonly IModelBinder Binder = new FileDataModelBinder();

    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        return typeof(IFileData).IsAssignableFrom(context.Metadata.ModelType)
            ? Binder
            : null;
    }
}
